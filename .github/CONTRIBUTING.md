# Contributing

Thank you for taking the time to contribute!

## Getting started

1. Fork the repository and clone it locally.
2. Install dependencies:
   ```bash
   cd proxy-server
   npm install
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/my-improvement
   ```

## Development workflow

- Start the proxy: `npm start` inside `proxy-server/`
- Open `chat-test.html` via a static server (e.g. `npx serve .` from the repo root)
- Confirm chat messages, emotes, and links render correctly

## Code style

- ES Modules (`import`/`export`) throughout
- 4-space indentation
- Keep `server.js` dependency-free beyond `ws`
- Prefer descriptive `console.log` prefixes: `[Proxy]`, `[Kick]`, `[Chat]`

## Submitting changes

1. Push your branch and open a Pull Request against `main`.
2. Fill in the PR template.
3. One approving review is required before merging.

## Reporting bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include proxy console output.

## License

By contributing you agree that your contributions will be licensed under the [GPL-3.0 License](../LICENSE).
