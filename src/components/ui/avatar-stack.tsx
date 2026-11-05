import type { Contact } from "@/lib/content";

/** Adapted avatar group: the real team as monogram tiles; no portraits are implied or invented. */
export function AvatarStack({ people }: { people: readonly Contact[] }) {
  return (
    <span className="avatar-stack" aria-hidden="true">
      {people.map((person) => (
        <span className="avatar" key={person.name}>
          {person.name.charAt(0)}
        </span>
      ))}
    </span>
  );
}
