import { FileMetric } from "../../utils/types";

interface Props {
  filteredFiles: FileMetric[];
  totalCommits: number
}

const FileMetricsDisplay : React.FC<Props> = ({filteredFiles, totalCommits}) => {
    return(
        filteredFiles.map((file: FileMetric, idx: number) => (
            <div key={idx} className="bg-vscode-sidebar border border-vscode-border p-4 rounded-lg group transition-all hover:border-vscode-focus">
              <div className="flex justify-between items-start gap-4 mb-2">
                <span className="font-mono text-sm break-all text-vscode-chart-blue opacity-90">{file.path}</span>
                <span className="font-bold text-xs whitespace-nowrap bg-vscode-bg px-2 py-1 rounded">{file.totalCommits} commits</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.7rem] opacity-60 mb-3">
                <span>{file.uniqueAuthors.length} authors</span>
                <span>•</span>
                <span>{file.daysSinceLastCommit} days old</span>
                {file.dangerLevel && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${file.dangerLevel === 'high' ? 'bg-vscode-chart-red/20 text-red-400' :
                        file.dangerLevel === 'medium' ? 'bg-vscode-chart-yellow/20 text-yellow-400' :
                          'bg-vscode-chart-green/20 text-green-400'
                      }`}>
                      {file.dangerLevel} risk
                    </span>
                  </>
                )}
              </div>
              <div className="h-1 bg-vscode-bg rounded overflow-hidden">
                <div
                  className="h-full bg-vscode-chart-blue rounded transition-all duration-500"
                  style={{ width: `${Math.min((file.totalCommits / (totalCommits / 15)) * 100, 100)}%` }}
                />
              </div>
            </div>
    )
)
    )

}

export default FileMetricsDisplay;