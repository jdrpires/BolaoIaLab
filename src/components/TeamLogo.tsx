import { useState } from "react";
import { initials } from "@/lib/api/format";
import type { ApiTeam } from "@/lib/api/types";

const countryCodes: Record<string, string> = {
  algeria: "DZ",
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  belgium: "BE",
  "bosnia & herzegovina": "BA",
  brazil: "BR",
  canada: "CA",
  "cape verde islands": "CV",
  colombia: "CO",
  "congo dr": "CD",
  croatia: "HR",
  curacao: "CW",
  "czech republic": "CZ",
  ecuador: "EC",
  egypt: "EG",
  england: "GB",
  france: "FR",
  germany: "DE",
  ghana: "GH",
  haiti: "HT",
  iran: "IR",
  iraq: "IQ",
  "ivory coast": "CI",
  japan: "JP",
  jordan: "JO",
  mexico: "MX",
  morocco: "MA",
  netherlands: "NL",
  "new zealand": "NZ",
  norway: "NO",
  panama: "PA",
  paraguay: "PY",
  portugal: "PT",
  qatar: "QA",
  "saudi arabia": "SA",
  scotland: "GB",
  senegal: "SN",
  "south africa": "ZA",
  "south korea": "KR",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  tunisia: "TN",
  turkiye: "TR",
  usa: "US",
  uruguay: "UY",
  uzbekistan: "UZ",
};

export function TeamLogo({
  team,
  size = "md",
  className = "",
}: {
  team: ApiTeam;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const sizeClass = {
    sm: "size-7",
    md: "size-12",
    lg: "size-16",
  }[size];
  const mark = initials(team.short_name || team.name).slice(0, 3);

  const logoSrc = team.logo_url;
  const flag = flagEmojiForTeam(team);

  if (logoSrc && !logoFailed) {
    return (
      <span
        className={`${sizeClass} ${className} inline-grid place-items-center rounded-full bg-white/95 border border-white/20 shadow-sm overflow-hidden`}
      >
        <img
          src={logoSrc}
          alt={`Bandeira de ${team.name}`}
          className="h-[78%] w-[78%] object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  if (flag) {
    return (
      <span
        className={`${sizeClass} ${className} rounded-full bg-white/95 grid place-items-center text-lg shadow-sm border border-white/20`}
        title={team.name}
      >
        {flag}
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} ${className} rounded-xl bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground`}
    >
      {mark}
    </span>
  );
}

function flagEmojiForTeam(team: ApiTeam) {
  const code = countryCodes[normalizeTeamName(team.name)];
  if (!code) return null;

  const base = 127397;
  return String.fromCodePoint(...code.split("").map((letter) => base + letter.charCodeAt(0)));
}

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
