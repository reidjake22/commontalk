import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Update your types to match the actual API response
type ClusterPoint = {
  id: number;
  text: string;
}

type ClusterData = {
  cluster_id: number;
  title?: string;
  summary?: string;
  points: ClusterPoint[];
  sub_clusters?: ClusterData[];
  layer?: number;
  parent_cluster_id?: number;
}

type ApiResponse = {
  success: boolean;
  data: ClusterData;
  error?: string;
}

// Party configuration
const PARTY_CONFIG = {
  1: { name: 'Alliance', shortName: 'APNI', color: '#cdaf2d' },
  4: { name: 'Conservative', shortName: 'Con', color: '#0063ba' },
  7: { name: 'Democratic Unionist Party', shortName: 'DUP', color: '#d46a4c' },
  8: { name: 'Independent', shortName: 'Ind', color: '#909090' },
  15: { name: 'Labour', shortName: 'Lab', color: '#d50000' },
  17: { name: 'Liberal Democrat', shortName: 'LD', color: '#faa01a' },
  22: { name: 'Plaid Cymru', shortName: 'PC', color: '#348837' },
  29: { name: 'Scottish National Party', shortName: 'SNP', color: '#fff685' },
  30: { name: 'Sinn Féin', shortName: 'SF', color: '#02665f' },
  31: { name: 'Social Democratic & Labour Party', shortName: 'SDLP', color: '#4ea268' },
  38: { name: 'Ulster Unionist Party', shortName: 'UUP', color: '#a1cdf0' },
  44: { name: 'Green Party', shortName: 'Green', color: '#78b82a' },
  47: { name: 'Speaker', shortName: 'Spk', color: '#666666' },
  158: { name: 'Traditional Unionist Voice', shortName: 'TUV', color: '#0c3a6a' },
  1036: { name: 'Reform UK', shortName: 'RUK', color: '#12b6cf' },
  0: { name: 'Other', shortName: 'Oth', color: '#999999' }
} as const;

// Generate a proper summary from points
function generateSummary(points: ClusterPoint[]): string {
  if (!points || points.length === 0) return "No discussion points available";
  
  // Get the most substantive points (longer text usually means more context)
  const substantivePoints = points
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 3);
  
  const themes = substantivePoints.map(p => {
    // Extract key themes from each point
    const text = p.text.toLowerCase();
    if (text.includes('economic') || text.includes('economy') || text.includes('growth')) return 'Economic Growth';
    if (text.includes('tax') || text.includes('revenue') || text.includes('funding')) return 'Taxation & Funding';
    if (text.includes('business') || text.includes('investment')) return 'Business Investment';
    if (text.includes('rural') || text.includes('regional')) return 'Regional Development';
    return 'Parliamentary Discussion';
  });
  
  const uniqueThemes = [...new Set(themes)];
  
  return `This topic covers ${uniqueThemes.join(', ').toLowerCase()} with ${points.length} related parliamentary discussions and questions.`;
}

// Sub-cluster display component
function SubClusterDisplay({ cluster, depth = 0 }: { cluster: ClusterData; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  
  const hasSubClusters = cluster.sub_clusters && cluster.sub_clusters.length > 0;
  const indentLevel = Math.min(depth * 6, 24); // Max indent of 24 (4 levels)
  
  return (
    <div className={`${depth > 0 ? `ml-${indentLevel} border-l-2 border-gray-200 pl-4` : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {hasSubClusters && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded bg-blue-50 hover:bg-blue-100 text-blue-600"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              
              <h3 className={`font-semibold ${depth === 0 ? 'text-lg' : 'text-base'}`}>
                {cluster.title || `Sub-topic ${cluster.cluster_id}`}
              </h3>
              
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {cluster.points?.length || 0} points
              </span>
            </div>
            
            <p className="text-gray-700 text-sm mb-3">
              {cluster.summary || generateSummary(cluster.points || [])}
            </p>
            
            {/* Show sample points */}
            {cluster.points && cluster.points.length > 0 && (
              <div className="space-y-2">
                <details className="group">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    View sample discussions →
                  </summary>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {cluster.points.slice(0, 3).map((point) => (
                      <div key={point.id} className="bg-gray-50 p-2 rounded text-xs">
                        <span className="text-gray-500">#{point.id}</span>
                        <p className="mt-1">{point.text}</p>
                      </div>
                    ))}
                    {cluster.points.length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        +{cluster.points.length - 3} more discussions...
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
          
          {hasSubClusters && (
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {cluster.sub_clusters!.length} sub-topic{cluster.sub_clusters!.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recursive sub-clusters */}
      {hasSubClusters && isExpanded && (
        <div className="space-y-3">
          {cluster.sub_clusters!.map((subCluster) => (
            <SubClusterDisplay 
              key={subCluster.cluster_id} 
              cluster={subCluster} 
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Topic() {
  const { id } = useParams();
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/topics/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiResponse: ApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(apiResponse.error || 'API returned error');
        }
        
        setClusterData(apiResponse.data);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load topic');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTopic();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (error || !clusterData) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 space-y-4">
        <Link to="/" className="text-sm text-blue-700 hover:underline">← Back to Trending</Link>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Topic Not Found</h1>
          <p className="text-gray-600">{error || 'The requested topic could not be found.'}</p>
        </div>
      </main>
    );
  }

  const mainSummary = clusterData.summary || generateSummary(clusterData.points || []);
  const totalPoints = (clusterData.points?.length || 0) + 
    (clusterData.sub_clusters?.reduce((sum, sub) => sum + (sub.points?.length || 0), 0) || 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
      {/* Navigation */}
      <nav>
        <Link to="/" className="text-sm text-blue-700 hover:underline">
          ← Back to Trending
        </Link>
      </nav>
      
      {/* Main Topic Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {clusterData.title || `Parliamentary Topic ${clusterData.cluster_id}`}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Cluster ID: {clusterData.cluster_id}</span>
                <span>•</span>
                <span>{totalPoints} total discussions</span>
                {clusterData.layer && (
                  <>
                    <span>•</span>
                    <span>Layer {clusterData.layer}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            {mainSummary}
          </p>
          
          {clusterData.points && clusterData.points.length > 0 && (
            <div className="pt-4 border-t border-blue-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Key Parliamentary Discussions ({clusterData.points.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {clusterData.points.slice(0, 4).map((point) => (
                  <div key={point.id} className="bg-white/70 rounded-lg p-3 text-sm">
                    <span className="text-gray-500 text-xs">#{point.id}</span>
                    <p className="mt-1 line-clamp-3">{point.text}</p>
                  </div>
                ))}
              </div>
              {clusterData.points.length > 4 && (
                <p className="text-sm text-gray-600 mt-2">
                  +{clusterData.points.length - 4} more discussions in this topic...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Sub-clusters Hierarchy */}
      {clusterData.sub_clusters && clusterData.sub_clusters.length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Sub-topics</h2>
            <p className="text-gray-600 mt-1">
              Explore {clusterData.sub_clusters.length} related discussion areas
            </p>
          </div>
          
          <div className="space-y-4">
            {clusterData.sub_clusters.map((subCluster) => (
              <SubClusterDisplay 
                key={subCluster.cluster_id} 
                cluster={subCluster} 
                depth={0}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
