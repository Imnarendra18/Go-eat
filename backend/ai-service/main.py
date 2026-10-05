from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services.groq_service import ask_groq
from services.rag_service import ingest_documents, search_context
from services.recommendation_service import simple_food_recommendation
from services.db_service import (
    check_db,
    get_foods,
    get_hotel_context,
    get_platform_summary,
    search_database_context,
)

app = FastAPI(title="GoEat AI Service")


def ask_ai_or_fallback(message: str, system_prompt: str, fallback: str, context: Any = None):
    try:
        return ask_groq(
            message=message,
            system_prompt=system_prompt,
            context=str(context) if context else None,
        ), None
    except Exception as error:
        return fallback, str(error)


def food_names(foods: List[Dict[str, Any]]) -> str:
    names = [food.get("name") or food.get("foodName") for food in foods]
    return ", ".join([name for name in names if name]) or "No matching foods found"


def hotel_names(hotels: List[Dict[str, Any]]) -> str:
    names = [hotel.get("hotelName") for hotel in hotels]
    return ", ".join([name for name in names if name]) or "No matching hotels found"


class ChatRequest(BaseModel):
    message: str


class RagChatRequest(BaseModel):
    message: str
    top_k: Optional[int] = 3


class FoodRecommendRequest(BaseModel):
    foods: Optional[List[Dict[str, Any]]] = None
    budget: Optional[float] = None
    vegOnly: Optional[bool] = False
    category: Optional[str] = None


class HotelAssistantRequest(BaseModel):
    message: str
    hotelName: Optional[str] = None
    hotelData: Optional[Dict[str, Any]] = None


class AdminAssistantRequest(BaseModel):
    message: str
    platformData: Optional[Dict[str, Any]] = None


@app.get("/")
def home():
    return {
        "success": True,
        "message": "GoEat AI Service is running",
    }


@app.get("/api/ai/test")
def test():
    db_connected = False
    try:
        db_connected = check_db()
    except Exception:
        db_connected = False

    return {
        "success": True,
        "message": "AI routes working",
        "dbConnected": db_connected,
    }


@app.post("/api/ai/chat")
def normal_chat(request: ChatRequest):
    try:
        db_context = search_database_context(request.message)
        system_prompt = (
            "You are GoEat AI assistant. "
            "Help users with food suggestions, order help, refund help, "
            "hotel suggestions, and GoEat support. "
            "Use the provided live database context when it is relevant. "
            "Only recommend foods or hotels that appear in the database context. "
            "Keep answers simple and useful."
        )

        fallback = (
            f"From the live database, matching foods: {food_names(db_context.get('foods', []))}. "
            f"Matching hotels: {hotel_names(db_context.get('hotels', []))}."
        )
        reply, ai_error = ask_ai_or_fallback(
            message=request.message,
            system_prompt=system_prompt,
            context=str(db_context),
            fallback=fallback,
        )

        return {
            "success": True,
            "userMessage": request.message,
            "databaseContext": db_context,
            "aiReply": reply,
            "aiError": ai_error,
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/api/ai/ingest")
def ingest_rag_docs():
    try:
        result = ingest_documents()
        return result

    except Exception as error:
        return {
            "success": False,
            "message": "RAG documents could not be ingested. Check the embedding model/network.",
            "error": str(error),
        }


@app.post("/api/ai/rag-chat")
def rag_chat(request: RagChatRequest):
    try:
        context_error = None
        try:
            context = search_context(
                query=request.message,
                top_k=request.top_k,
            )
        except Exception as error:
            context = ""
            context_error = str(error)

        system_prompt = (
            "You are GoEat RAG support assistant. "
            "Answer only using the provided GoEat context. "
            "If the context does not contain the answer, say that you do not have enough information."
        )

        reply, ai_error = ask_ai_or_fallback(
            message=request.message,
            system_prompt=system_prompt,
            context=context,
            fallback="I found support context, but the AI model is unavailable right now. Try again after checking the AI key/network.",
        )

        return {
            "success": True,
            "userMessage": request.message,
            "contextUsed": context,
            "aiReply": reply,
            "aiError": ai_error or context_error,
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/api/ai/recommend-food")
def recommend_food(request: FoodRecommendRequest):
    try:
        foods = request.foods or get_foods(
            budget=request.budget,
            veg_only=request.vegOnly,
            category=request.category,
        )

        recommended_foods = simple_food_recommendation(
            foods=foods,
            budget=request.budget,
            veg_only=request.vegOnly,
            category=request.category,
        )

        food_context = str(recommended_foods)

        system_prompt = (
            "You are GoEat food recommendation assistant. "
            "Recommend foods from the given food list only. "
            "Explain briefly why these foods are good choices."
        )

        user_message = (
            f"Recommend food with budget={request.budget}, "
            f"vegOnly={request.vegOnly}, category={request.category}. "
            f"Food list: {food_context}"
        )

        reply, ai_error = ask_ai_or_fallback(
            message=user_message,
            system_prompt=system_prompt,
            fallback=f"Recommended from the live database: {food_names(recommended_foods)}.",
        )

        return {
            "success": True,
            "recommendedFoods": recommended_foods,
            "aiReply": reply,
            "aiError": ai_error,
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/api/ai/hotel-assistant")
def hotel_assistant(request: HotelAssistantRequest):
    try:
        database_hotel_context = get_hotel_context(hotel_name=request.hotelName)
        hotel_context = database_hotel_context or request.hotelData

        system_prompt = (
            "You are GoEat hotel panel AI assistant. "
            "Help hotel owners improve food descriptions, menu pricing, "
            "ratings, order management, and customer satisfaction."
        )

        message = f"""
Hotel Name: {request.hotelName}
Live Hotel Data: {hotel_context}

Hotel Owner Question:
{request.message}
"""

        food_count = len((hotel_context or {}).get("foods", [])) if isinstance(hotel_context, dict) else 0
        review_count = len((hotel_context or {}).get("recentReviews", [])) if isinstance(hotel_context, dict) else 0
        fallback = f"Live hotel context loaded with {food_count} foods and {review_count} recent reviews. Check menu pricing, descriptions, and low-rated review themes first."
        reply, ai_error = ask_ai_or_fallback(
            message=message,
            system_prompt=system_prompt,
            fallback=fallback,
        )

        return {
            "success": True,
            "message": request.message,
            "hotelContext": hotel_context,
            "aiReply": reply,
            "aiError": ai_error,
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/api/ai/admin-assistant")
def admin_assistant(request: AdminAssistantRequest):
    try:
        platform_data = get_platform_summary() or request.platformData

        system_prompt = (
            "You are GoEat admin AI assistant. "
            "Help admin summarize orders, payments, refunds, hotels, foods, "
            "reviews, users, and platform performance."
        )

        message = f"""
Platform Data:
{platform_data}

Admin Question:
{request.message}
"""

        fallback = (
            f"Live platform summary: {platform_data.get('totalOrders', 0)} orders, "
            f"{platform_data.get('totalFoods', 0)} foods, "
            f"{platform_data.get('totalHotels', 0)} hotels, "
            f"{platform_data.get('successfulPayments', 0)} successful payments."
        )
        reply, ai_error = ask_ai_or_fallback(
            message=message,
            system_prompt=system_prompt,
            fallback=fallback,
        )

        return {
            "success": True,
            "message": request.message,
            "platformData": platform_data,
            "aiReply": reply,
            "aiError": ai_error,
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
