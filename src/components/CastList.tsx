import Image from "next/image";
import type { CastMember } from "@/lib/tmdb/types";

type CastListProps = {
  cast: CastMember[];
};

export function CastList({ cast }: CastListProps) {
  if (cast.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {cast.map((member, index) => (
        <div key={`${member.name}-${index}`} className="flex w-20 flex-shrink-0 flex-col items-center gap-2 text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[var(--surface)]">
            {member.profileUrl ? (
              <Image src={member.profileUrl} alt={member.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--foreground)]/60">
                {member.name.slice(0, 1)}
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-[var(--foreground)]">{member.name}</p>
          {member.character && (
            <p className="text-xs text-[var(--foreground)]/60">{member.character}</p>
          )}
        </div>
      ))}
    </div>
  );
}
