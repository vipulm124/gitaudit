import { AuthorStat } from "../../utils/types";

interface Props {
  filteredAuthors: AuthorStat[];
  expandedAuthor: string | null;
  searchTerm: string;
  toggleAuthor: (email: string) => void;
}

const AuthorStatDisplay: React.FC<Props> = ({
  filteredAuthors,
  expandedAuthor,
  searchTerm,
  toggleAuthor,
}) => {
  return filteredAuthors.length === 0 ? (
    <div className="p-12 text-center opacity-40 italic text-sm">
      No matching contributors...
    </div>
  ) : (
    filteredAuthors.map((author, idx) => (
      <div
        key={idx}
        className={`flex flex-col bg-vscode-sidebar border rounded-lg transition-all ${
          expandedAuthor === author.authorEmail
            ? "border-vscode-focus ring-1 ring-vscode-focus/20 shadow-lg"
            : "border-vscode-border"
        }`}
      >
        <div
          className="p-4 flex items-center justify-between cursor-pointer group"
          onClick={() => toggleAuthor(author.authorEmail)}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm group-hover:text-vscode-chart-blue transition-colors">
              {author.author}
            </span>
            <span className="text-[0.65rem] opacity-40 truncate max-w-[150px]">
              {author.authorEmail}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-xs bg-vscode-bg px-2 py-1 rounded">
              {author.commitCounts} commits
            </span>
            <span
              className={`text-[0.6rem] opacity-40 transform transition-transform duration-200 ${expandedAuthor === author.authorEmail ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${expandedAuthor === author.authorEmail ? "max-h-[1000px] border-t border-vscode-border opacity-100 p-4" : "max-h-0 opacity-0"}`}
        >
          <p className="text-[0.65rem] uppercase tracking-wider opacity-40 mb-3">
            Contributions ({author.files.length} files)
          </p>
          <div className="flex flex-wrap gap-2">
            {(expandedAuthor === author.authorEmail
              ? author.files
              : author.files.slice(0, 8)
            ).map((f, fidx) => (
              <span
                key={fidx}
                className={`px-2 py-1 rounded text-[0.65rem] font-mono leading-none transition-colors scrollbar-hide ${
                  searchTerm &&
                  f.toLowerCase().includes(searchTerm.toLowerCase())
                    ? "bg-vscode-chart-blue/30 text-vscode-chart-blue border border-vscode-chart-blue"
                    : "bg-vscode-bg border border-vscode-border"
                }`}
              >
                {f}
              </span>
            ))}
            {expandedAuthor !== author.authorEmail &&
              author.files.length > 8 && (
                <span className="px-2 py-1 rounded text-[0.65rem] bg-vscode-sidebar border border-vscode-border cursor-pointer hover:bg-vscode-hover">
                  +{author.files.length - 8} more
                </span>
              )}
          </div>
          {expandedAuthor === author.authorEmail && (
            <button
              className="mt-4 text-[0.65rem] text-vscode-chart-blue hover:underline p-0 m-0 border-none bg-transparent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleAuthor(author.authorEmail);
              }}
            >
              Collapse history ▴
            </button>
          )}
        </div>
      </div>
    ))
  );
};

export default AuthorStatDisplay;
