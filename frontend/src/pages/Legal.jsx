import { Link } from "react-router-dom";
import { ArrowLeft, ShieldWarning, ChatCircleText, WhatsappLogo } from "@phosphor-icons/react";

export default function Legal() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link to="/" className="text-[#4A5D50] flex items-center gap-1 text-sm mb-6 hover:text-[#D84315]">
        <ArrowLeft size={16} /> Retour à l&apos;accueil
      </Link>

      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22]">Conditions d&apos;utilisation</h1>
      <p className="text-sm text-[#4A5D50] mt-2">Dernière mise à jour : mai 2026</p>

      <div className="mt-8 space-y-8 text-[#1A2E22]">
        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">1. Objet</h2>
          <p className="text-sm text-[#4A5D50] leading-relaxed">
            Zokko est une marketplace en ligne permettant aux particuliers et professionnels en Guinée de publier des annonces,
            d&apos;échanger via WhatsApp ou messagerie interne, et de conclure des transactions entre utilisateurs.
            Zokko met en relation acheteurs et vendeurs ; elle n&apos;est pas partie aux ventes conclues entre utilisateurs.
          </p>
        </section>

        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">2. Compte utilisateur</h2>
          <p className="text-sm text-[#4A5D50] leading-relaxed">
            L&apos;inscription se fait avec un numéro de téléphone guinéen (+224) et un code secret à 6 chiffres choisi par
            l&apos;utilisateur. Vous êtes responsable de la confidentialité de votre code. Ne le partagez avec personne.
          </p>
        </section>

        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">3. Annonces et contenu</h2>
          <p className="text-sm text-[#4A5D50] leading-relaxed">
            Vous vous engagez à publier des annonces exactes, légales et non trompeuses. Sont interdits : contrefaçons,
            arnaques, contenus illicites, discours haineux ou contenus pour adultes. Zokko se réserve le droit de modérer,
            suspendre ou supprimer toute annonce ou compte sans préavis en cas de violation.
          </p>
        </section>

        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">4. Paiements</h2>
          <p className="text-sm text-[#4A5D50] leading-relaxed">
            Les services payants (boost, premium, abonnement pro) se règlent par Orange Money : transfert au numéro
            indiqué dans l&apos;application, puis envoi de la preuve de transaction (code + capture d&apos;écran) pour
            validation par notre équipe. Les transactions entre acheteurs et vendeurs se font directement entre les parties ;
            Zokko n&apos;encaisse pas le prix des biens vendus sur la plateforme.
          </p>
        </section>

        <section className="bg-[#FBC02D]/10 border border-[#FBC02D]/40 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <ShieldWarning size={28} weight="fill" className="text-[#FBC02D] flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-xl mb-3">5. Avertissement marketplace</h2>
              <p className="text-sm text-[#4A5D50] leading-relaxed">
                Zokko ne garantit ni la qualité, ni la livraison, ni l&apos;existence réelle des biens proposés.
                Méfiez-vous des offres trop belles pour être vraies, des demandes d&apos;acompte sans rencontre,
                et des paiements vers des comptes non vérifiés. Privilégiez les rencontres en personne dans un lieu public
                et signalez toute annonce suspecte via le bouton de signalement.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">6. Limitation de responsabilité</h2>
          <p className="text-sm text-[#4A5D50] leading-relaxed">
            Zokko est fourni « en l&apos;état ». Dans les limites permises par la loi, Zokko décline toute responsabilité
            pour les litiges, pertes financières ou dommages résultant de transactions entre utilisateurs ou de l&apos;usage
            de la plateforme.
          </p>
        </section>

        <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <h2 className="font-heading font-bold text-xl mb-3">7. Contact &amp; support</h2>
          <ul className="text-sm text-[#4A5D50] space-y-2">
            <li className="flex items-center gap-2">
              <WhatsappLogo size={18} weight="fill" className="text-[#25D366]" />
              WhatsApp : +224 612 51 64 88
            </li>
            <li className="flex items-center gap-2">
              <ChatCircleText size={18} />
              E-mail : support@zokko.gn
            </li>
            <li>Adresse : Conakry, Guinée</li>
          </ul>
          <p className="text-sm text-[#4A5D50] mt-4 leading-relaxed">
            Pour signaler une arnaque, un contenu illicite ou demander la suppression de votre compte, contactez-nous
            par WhatsApp ou e-mail en précisant le lien de l&apos;annonce concernée.
          </p>
        </section>
      </div>
    </div>
  );
}
