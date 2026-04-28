# GitAudit

A VS Code extension that analyzes your Git repository to identify risky and problematic files based on git history metrics.

## Features

- **Repository Analysis**: Scans your entire Git repository to identify high-risk files
- **Risk Scoring**: Uses multiple metrics to calculate a "danger score" for each file:
  - **Recency**: How recently the file was touched (untouched files are risky)
  - **Ownership**: Number of authors who have touched the file (limited knowledge base is risky)
  - **Bug Magnet**: Ratio of bug-fix commits to total commits
  - **Churn Rate**: How frequently the file changes
- **Forbidden Files Detection**: Identifies files that exceed danger thresholds and could benefit from refactoring or increased testing
- **Author Chart**: Visualizes file ownership and contribution history
- **File Metrics Display**: Shows detailed metrics for individual files
- **Interactive Dashboard**: Real-time webview interface to explore analysis results
- **Caching**: Results are cached to avoid repeated analysis within a configurable TTL
- **Configurable Thresholds**: Customize detection parameters for your project's needs

## Installation

Install the extension from the [VS Code Extensions Marketplace](https://marketplace.visualstudio.com/items?itemName=your-publisher.gitaudit) by searching for "GitAudit".

## Quick Start

1. Open a folder with a Git repository in VS Code
2. Run the **GitAudit** commands from the Command Palette (`Ctrl+Shift+P`):
   - **GitAudit: Show repo dashboard** - Display the analysis dashboard
   - **GitAudit: Run repo analysis** - Trigger a full repository analysis

The extension will scan your Git history and display results in an interactive webview dashboard.

## Configuration

Configure GitAudit behavior in your VS Code settings (`settings.json`):

```json
{
  "gitaudit.minDaysSinceTouch": 60,
  "gitaudit.maxAuthors": 3,
  "gitaudit.minCommits": 10,
  "gitaudit.minBugFixRatio": 0.15,
  "gitaudit.minDangerScore": 40,
  "gitaudit.cacheTTLHours": 24,
  "gitaudit.dangerScoreWeights": {
    "recency": 0.3,
    "ownership": 0.25,
    "bugMagnet": 0.3,
    "churnRate": 0.15
  },
  "gitaudit.bugFixKeywords": ["fix", "bug", "patch", "hotfix", "issue", "error", "crash"],
  "gitaudit.refactorKeywords": ["refactor", "cleanup"]
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `minDaysSinceTouch` | number | 60 | Minimum days since last commit to flag a file as untouched |
| `maxAuthors` | number | 3 | Files touched by ≤ this many authors are flagged as high risk (limited knowledge base) |
| `minCommits` | number | 10 | Files with fewer commits are ignored (too new to judge) |
| `minBugFixRatio` | number | 0.15 | Files where this fraction or more of commits are bug fixes are flagged |
| `minDangerScore` | number | 40 | Minimum danger score threshold (0-100) for forbidden files detection |
| `cacheTTLHours` | number | 24 | Hours before cached analysis is considered stale |
| `dangerScoreWeights` | object | See below | Weights for danger score components (must sum to 1) |
| `bugFixKeywords` | array | fix, bug, patch, ... | Keywords used to identify bug-fix commits |
| `refactorKeywords` | array | refactor, cleanup | Keywords used to identify refactoring commits |

### Danger Score Weights (Default)

```json
{
  "recency": 0.3,      // 30% - how recently modified
  "ownership": 0.25,   // 25% - number of authors
  "bugMagnet": 0.3,    // 30% - bug fix ratio
  "churnRate": 0.15    // 15% - change frequency
}
```

## Requirements

- VS Code 1.85+
- A Git repository

## Issues and Feedback

Report issues or suggest features on the [GitHub repository](https://github.com/vipulm124/gitaudit).

