import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAMES = {
    "foods": os.getenv("FOOD_DB_NAME", "goeat_food"),
    "hotels": os.getenv("HOTEL_DB_NAME", "goeat_hotel"),
    "orders": os.getenv("ORDER_DB_NAME", "goeat_order"),
    "payments": os.getenv("PAYMENT_DB_NAME", "goeat_payment"),
    "reviews": os.getenv("REVIEW_DB_NAME", "goeat_reviews"),
    "users": os.getenv("AUTH_DB_NAME", "goeat_auth"),
}

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)


def _clean(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [_clean(item) for item in value]
    if isinstance(value, dict):
        return {key: _clean(item) for key, item in value.items()}
    return value


def _collection(area: str, name: str):
    return client[DB_NAMES[area]][name]


def check_db() -> bool:
    client.admin.command("ping")
    return True


def get_foods(limit: int = 30, budget: float = None, veg_only: bool = False, category: str = None) -> List[Dict[str, Any]]:
    filter_query: Dict[str, Any] = {"isAvailable": {"$ne": False}}
    if budget:
        filter_query["price"] = {"$lte": budget}
    if veg_only:
        filter_query["isVeg"] = True
    if category:
        filter_query["category"] = {"$regex": re.escape(category), "$options": "i"}

    foods = _collection("foods", "foods").find(filter_query).sort([("rating", -1), ("createdAt", -1)]).limit(limit)
    return [_clean(food) for food in foods]


def get_hotels(limit: int = 20, only_approved: bool = False) -> List[Dict[str, Any]]:
    filter_query = {"isOpen": {"$ne": False}}
    if only_approved:
        filter_query["isApproved"] = True

    hotels = _collection("hotels", "hotels").find(filter_query).sort([("rating", -1), ("createdAt", -1)]).limit(limit)
    return [_clean(hotel) for hotel in hotels]


def get_hotel_context(hotel_name: str = None, hotel_id: str = None) -> Dict[str, Any]:
    filter_query: Dict[str, Any] = {}
    if hotel_id:
        filter_query["_id"] = ObjectId(hotel_id) if ObjectId.is_valid(hotel_id) else hotel_id
    elif hotel_name:
        filter_query["hotelName"] = {"$regex": re.escape(hotel_name), "$options": "i"}

    hotel = _collection("hotels", "hotels").find_one(filter_query) if filter_query else None
    if not hotel:
        return {}

    hotel = _clean(hotel)
    foods = list(_collection("foods", "foods").find({"hotelId": hotel["_id"]}).sort("createdAt", -1).limit(25))
    reviews = list(_collection("reviews", "reviews").find({"hotelId": hotel["_id"]}).sort("createdAt", -1).limit(10))

    return {
        "hotel": hotel,
        "foods": [_clean(food) for food in foods],
        "recentReviews": [_clean(review) for review in reviews],
    }


def get_platform_summary() -> Dict[str, Any]:
    foods = _collection("foods", "foods")
    hotels = _collection("hotels", "hotels")
    orders = _collection("orders", "orders")
    payments = _collection("payments", "payments")
    reviews = _collection("reviews", "reviews")
    users = _collection("users", "users")

    recent_orders = orders.find().sort("createdAt", -1).limit(10)
    recent_payments = payments.find().sort("createdAt", -1).limit(10)

    return {
        "totalFoods": foods.count_documents({}),
        "availableFoods": foods.count_documents({"isAvailable": {"$ne": False}}),
        "totalHotels": hotels.count_documents({}),
        "approvedHotels": hotels.count_documents({"isApproved": True}),
        "totalOrders": orders.count_documents({}),
        "pendingOrders": orders.count_documents({"orderStatus": "PENDING"}),
        "deliveredOrders": orders.count_documents({"orderStatus": "DELIVERED"}),
        "totalPayments": payments.count_documents({}),
        "successfulPayments": payments.count_documents({"status": "SUCCESS"}),
        "totalReviews": reviews.count_documents({}),
        "totalUsers": users.count_documents({}),
        "recentOrders": [_clean(order) for order in recent_orders],
        "recentPayments": [_clean(payment) for payment in recent_payments],
    }


def search_database_context(message: str) -> Dict[str, Any]:
    words = [re.escape(word) for word in message.split() if len(word) > 2][:6]
    search = "|".join(words)

    if search:
        food_filter = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"hotelName": {"$regex": search, "$options": "i"}},
            ],
            "isAvailable": {"$ne": False},
        }
        hotel_filter = {
            "$or": [
                {"hotelName": {"$regex": search, "$options": "i"}},
                {"cuisines": {"$regex": search, "$options": "i"}},
                {"address": {"$regex": search, "$options": "i"}},
            ],
            "isOpen": {"$ne": False},
        }
    else:
        food_filter = {"isAvailable": {"$ne": False}}
        hotel_filter = {"isOpen": {"$ne": False}}

    foods = [_clean(food) for food in _collection("foods", "foods").find(food_filter).sort([("rating", -1), ("createdAt", -1)]).limit(10)]
    hotels = [_clean(hotel) for hotel in _collection("hotels", "hotels").find(hotel_filter).sort([("rating", -1), ("createdAt", -1)]).limit(8)]

    if not foods:
        foods = get_foods(limit=10)
    if not hotels:
        hotels = get_hotels(limit=8)

    return {
        "foods": foods,
        "hotels": hotels,
    }
