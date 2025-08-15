// File: src/components/topics/SubTopicBar.tsx
// =============================================
import type { FeaturedTopicOut } from "../../lib/types";

export function SubTopicBar({ subTopics }: { subTopics?: FeaturedTopicOut[] }) {
  if (!subTopics?.length) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600 font-medium">Related Topics</div>
      <div className="space-y-1">
        {subTopics.slice(0, 3).map((subTopic, index) => (
          <div key={subTopic.topic_id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{subTopic.title}</div>
            </div>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(20, 100 - index * 25)}%` }}
              />
            </div>
          </div>
        ))}
        {subTopics.length > 3 && (
          <div className="text-xs text-gray-500 pt-1">+{subTopics.length - 3} more topics</div>
        )}
      </div>
    </div>
  );
}