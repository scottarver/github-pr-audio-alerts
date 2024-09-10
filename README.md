# GitHub PR Alert

This userscript enhances GitHub pull request pages by adding audio alerts for various events, including new comments, merge status changes, and PR status updates.

## Features

- Unique audio signatures for each pull request
- Dynamic sounds for new comments, edits, and deletions
- Alerts for merge status changes
- Notifications for PR status updates
- Special alert for successful build and deploy comments

## Installation

1. Install a userscript manager like Tampermonkey or Greasemonkey in your browser.
2. Create a new script in your userscript manager.
3. Copy the contents of `src/github-pr-alert.user.js` into the new script.
4. Save the script and ensure it's enabled.

## Usage

Once installed, the script will automatically run on GitHub pull request pages. You'll hear audio alerts for various events as you interact with the page.

### Testing

You can test the various alerts using the `window.testPRAlert` object in the browser console:

```javascript
window.testPRAlert.newComment();
window.testPRAlert.editComment();
window.testPRAlert.deleteComment();
window.testPRAlert.mergeStatusChange('success');
window.testPRAlert.prStatusChange('closed');
window.testPRAlert.buildDeployed();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.