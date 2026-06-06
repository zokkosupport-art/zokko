import { Component } from "react";
import { Link } from "react-router-dom";

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="font-heading font-bold text-xl text-[#1A2E22] mb-2">Oups, une erreur est survenue</p>
          <p className="text-sm text-[#4A5D50] mb-6">Rechargez la page ou revenez à l&apos;accueil.</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-[#D84315] text-white rounded-full py-3 font-semibold"
            >
              Recharger
            </button>
            <Link to="/listings" className="text-[#D84315] font-semibold">
              Voir les annonces
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
