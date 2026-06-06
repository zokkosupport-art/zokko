import { Link } from "react-router-dom";

import { Check } from "@phosphor-icons/react";

import { formatPrice } from "@/lib/api";

import { ZOKKO_OFFERS, paymentPath } from "@/lib/offers";



/**

 * @param {"boost"|"premium"|"pro_subscription"} purpose

 * @param {string} [listingId]

 * @param {"default"|"compact"} variant

 */

export default function OfferCard({ purpose, listingId, variant = "default", className = "" }) {

  const offer = ZOKKO_OFFERS[purpose];

  if (!offer) return null;

  const Icon = offer.icon;

  const href = paymentPath(purpose, offer.needsListing ? listingId : undefined);

  const disabled = offer.needsListing && !listingId;

  const accent = offer.color;



  const compact = variant === "compact";



  return (

    <div

      className={`relative flex flex-col bg-white border-2 rounded-2xl overflow-hidden ${

        offer.recommended ? "shadow-md" : "border-[#E5E0D8]"

      } ${className}`}

      style={offer.recommended ? { borderColor: accent } : undefined}

      data-testid={`offer-card-${purpose}`}

    >

      {offer.recommended && (

        <span

          className="absolute top-0 right-0 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-bl-xl"

          style={{ backgroundColor: accent }}

        >

          Recommandé

        </span>

      )}

      <div className="p-4 sm:p-5 flex-1 flex flex-col" style={{ borderTop: `4px solid ${accent}` }}>

        <div

          className={`rounded-xl flex items-center justify-center text-white mb-3 ${compact ? "w-11 h-11" : "w-14 h-14"}`}

          style={{ backgroundColor: accent }}

        >

          <Icon size={compact ? 24 : 28} weight="fill" />

        </div>

        <h3 className={`font-heading font-bold text-[#1A2E22] ${compact ? "text-base" : "text-lg"}`}>

          {offer.label}

        </h3>

        {!compact && <p className="text-xs text-[#4A5D50] mt-1">{offer.tagline}</p>}

        <p className="font-heading font-bold text-xl sm:text-2xl mt-2" style={{ color: accent }}>

          {formatPrice(offer.price, offer.currency)}

          <span className="text-xs font-semibold text-[#4A5D50] ml-1">/ {offer.period}</span>

        </p>

        <ul className={`mt-3 space-y-1.5 flex-1 ${compact ? "text-xs" : "text-sm"} text-[#4A5D50]`}>

          {offer.benefits.map((b) => (

            <li key={b} className="flex items-start gap-2">

              <Check size={compact ? 14 : 16} weight="bold" className="flex-shrink-0 mt-0.5" style={{ color: accent }} />

              <span>{b}</span>

            </li>

          ))}

        </ul>

        {disabled ? (

          <p className="mt-4 text-xs text-[#4A5D50] bg-[#FAF8F5] rounded-xl px-3 py-2 text-center">

            Choisissez une annonce ci-dessous

          </p>

        ) : (

          <Link

            to={href}

            className={`mt-4 inline-flex items-center justify-center rounded-full font-bold text-center text-white transition-opacity hover:opacity-90 ${

              compact ? "py-2.5 text-sm" : "py-3 text-sm sm:text-base"

            }`}

            style={{ backgroundColor: accent }}

            data-testid={`offer-cta-${purpose}`}

          >

            {listingId && offer.needsListing ? offer.cta : offer.cta}

          </Link>

        )}

      </div>

    </div>

  );

}


