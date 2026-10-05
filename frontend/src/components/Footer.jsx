import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div>
        <Link to="/" className="footerBrand">
          Go<span>Eat</span>
        </Link>
        <p>
          Fresh meals, live orders, delivery tracking, and hotel tools in one
          place.
        </p>
      </div>
      <div className="footerLinks">
        <Link to="/foods">Foods</Link>
        <Link to="/hotels">Hotels</Link>
        <Link to="/recommendations">Recommendations</Link>
        <Link to="/ai">AI help</Link>
      </div>
      <div className="footerContact">
        <span>
          <Phone size={15} /> +91 91224 35955
        </span>
        <span>
          <Mail size={15} /> gjain7764@gmail.com
        </span>
        <span>
          <MapPin size={15} /> India
        </span>
      </div>
    </footer>
  );
}
