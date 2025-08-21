// import { PARTY, type PartyKey } from "../lib/party-resolver";
// import { Link } from "react-router-dom";

// type Contributor = { name: string; party: PartyKey; avatar: string };
// type Props = {
//   id: string | number;
//   title: string;
//   summary: string;
//   partyMix: Partial<Record<PartyKey, number>>; // 0..1 fractions
//   contributors: Contributor[];
// };

// export default function TopicCard({ id, title, summary, partyMix, contributors }: Props) {
//   const segments = Object.entries(partyMix ?? {}) as [PartyKey, number][];
//   const aria = segments.map(([k, v]) => `${labelFor(k)} ${Math.round((v ?? 0) * 100)}%`).join(", ");

//   return (
//     <article
//       className="
//         relative h-full bg-white rounded-xl border border-gray-200 p-6
//         flex flex-col justify-between
//         motion-safe:transition-all motion-safe:duration-200 hover:shadow-lg hover:-translate-y-0.5
//       "
//     >
//       {/* spark strip */}
//       <div className="absolute inset-x-0 top-0 h-0.5 brand-gradient rounded-t-xl" />

//       <header>
//         <div className="flex items-start justify-between gap-3">
//           <h3 className="text-base md:text-lg font-semibold leading-snug">{title}</h3>
//           <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
//             <span className="brand-text">Trending</span>
//           </span>
//         </div>
//         <p className="mt-2 text-sm text-gray-700 line-clamp-4">{summary}</p>
//       </header>

//       <div>
//         {/* party mix bar */}
//         <div
//           className="mt-4 h-2 w-full rounded overflow-hidden flex border border-gray-300"
//           role="img"
//           aria-label={aria}
//         >
//           {segments.map(([k, v]) => (
//             <div key={k} style={{ width: `${(v ?? 0) * 100}%`, backgroundColor: PARTY[k] }} />
//           ))}
//         </div>

//         {/* link + contributors */}
//         <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//           <Link
//             to={`/topics/${id}`}
//             className="text-sm font-medium px-3 py-1 rounded-md border border-transparent
//                        motion-safe:transition-colors hover:border-[var(--brand-1)]"
//           >
//             <span className="brand-text">Explore →</span>
//           </Link>

//           <div className="flex items-center justify-start md:justify-end -space-x-2">
//             {contributors.slice(0, 4).map((m) => (
//               <div key={m.name} className="relative w-8 h-8 rounded-full ring-2 ring-white overflow-hidden" title={m.name}>
//                 <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
//                 <span
//                   className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white"
//                   style={{ backgroundColor: PARTY[m.party] }}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </article>
//   );
// }

// function labelFor(p: PartyKey) {
//   switch (p) {
//     case "con": return "Conservative";
//     case "lab": return "Labour";
//     case "lib": return "Liberal Democrat";
//     case "snp": return "SNP";
//     case "grn": return "Green";
//     default: return "Other";
//   }
// }
