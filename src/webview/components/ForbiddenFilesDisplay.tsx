import { ForbiddenFile } from "../../utils/types";

interface Props {
  filteredForbidden: ForbiddenFile[];
}

const ForbiddenFilesDisplay: React.FC<Props> = ({ filteredForbidden }) => {
  return filteredForbidden.length === 0 ? (
    <div className="p-12 text-center opacity-40 italic text-sm">
      No critical flags found...
    </div>
  ) : (
    filteredForbidden.map((item, idx) => (
      <div
        key={idx}
        className="bg-vscode-sidebar border border-vscode-border p-4 rounded-lg border-l-4 border-l-vscode-chart-red"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-mono text-sm text-vscode-chart-red font-bold">
            {item.file.path}
          </span>
          <div className="bg-vscode-chart-red text-white text-xs px-2 py-1 rounded font-bold">
            {item.forbiddenScore}
          </div>
        </div>
        <ul className="flex flex-col gap-2 p-0 m-0 mb-4 list-none">
          {item.reasons.map((reason, ridx) => (
            <li
              key={ridx}
              className="text-xs opacity-80 flex items-start gap-2"
            >
              <span className="text-vscode-chart-red">•</span>
              {reason}
            </li>
          ))}
        </ul>
        <div className="flex gap-3 text-[0.65rem] opacity-50 mt-auto pt-2 border-t border-vscode-border">
          <span>{item.file.totalCommits} total commits</span>
          <span>•</span>
          <span>{item.file.uniqueAuthors.length} contributors</span>
        </div>
      </div>
    ))
  );
};

export default ForbiddenFilesDisplay;
