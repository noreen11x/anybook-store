import { TONES } from "@/lib/data";

/**
 * Decorative bookshelf drawn from the cover cloth colours. Stands in for the prototype's
 * drag-in photo slots (hero / newsletter) until real photography is supplied.
 */
export function ShelfArt({ rows = 3, seed = 1 }: { rows?: number; seed?: number }) {
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  return (
    <div className="shelf" aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <div className="shelf-row" key={r}>
          {Array.from({ length: 14 }, (_, i) => {
            const [bg, ink] = TONES[Math.floor(rnd() * TONES.length)];
            const lean = rnd() > 0.93;
            return (
              <span
                key={i}
                className="spine"
                style={{
                  background: bg,
                  color: ink,
                  flex: `${0.6 + rnd() * 0.9} 1 0`,
                  height: `${62 + rnd() * 36}%`,
                  transform: lean ? "rotate(-7deg)" : undefined,
                  transformOrigin: "bottom left",
                  marginRight: rnd() > 0.85 ? "4%" : undefined,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
