import { ShoppingBag } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", text = "Once data is available it will show here." }) {
  return (
    <div className="emptyState">
      <ShoppingBag size={38} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
