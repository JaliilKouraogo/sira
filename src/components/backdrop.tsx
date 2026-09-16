/**
 * Fond animé des pages de présentation.
 *
 * Trois lavis de couleur dérivent lentement, et une trame fine glisse en
 * arrière-plan. Les opacités sont volontairement très basses : l'effet se
 * perçoit sans jamais être identifiable, ce qui donne de la présence à la
 * page sans contredire le parti pris épuré.
 *
 * Tout est en CSS : aucune dépendance, aucun JavaScript, aucun repeint hors
 * de la composition GPU. Le composant est purement décoratif, il ne reçoit
 * aucun événement de pointeur et reste invisible aux lecteurs d'écran.
 *
 * Le réglage système « mouvement réduit » fige l'ensemble, voir globals.css.
 */

type Variant = "hero" | "section";

export function Backdrop({ variant = "hero" }: { variant?: Variant }) {
  if (variant === "section") {
    // Version discrète pour les sections courantes : un seul lavis, pas de trame.
    return (
      <div className="sira-backdrop" aria-hidden>
        <span
          className="sira-orb sira-orb-b"
          style={
            {
              "--orb": "var(--aurora-navy-soft)",
              left: "-10%",
              top: "-40%",
              width: "60%",
              height: "180%",
            } as React.CSSProperties
          }
        />
      </div>
    );
  }

  return (
    <div className="sira-backdrop" aria-hidden>
      {/* Lavis marine, en haut à droite, le plus large */}
      <span
        className="sira-orb sira-orb-a"
        style={
          {
            "--orb": "var(--aurora-navy)",
            right: "-18%",
            top: "-45%",
            width: "72%",
            height: "150%",
          } as React.CSSProperties
        }
      />
      {/* Lavis or, à gauche, qui monte lentement */}
      <span
        className="sira-orb sira-orb-b"
        style={
          {
            "--orb": "var(--aurora-gold)",
            left: "-22%",
            top: "10%",
            width: "62%",
            height: "120%",
          } as React.CSSProperties
        }
      />
      {/* Lavis marine dilué, au centre bas, pour lier les deux premiers */}
      <span
        className="sira-orb sira-orb-c"
        style={
          {
            "--orb": "var(--aurora-navy-soft)",
            left: "28%",
            bottom: "-60%",
            width: "56%",
            height: "120%",
          } as React.CSSProperties
        }
      />
      {/* Trame fine, estompée vers les bords */}
      <span className="sira-mesh" />
    </div>
  );
}
