# Test GitHub MCP Connection

## After Setting Up Your Token

1. **Replace the placeholder in your MCP config**:
   - Open `C:/Users/Disaster Recovery 4/.claude/mcp.json`
   - Replace `"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"` with your actual GitHub Personal Access Token

2. **Restart Claude/Cline**:
   - Close and reopen Claude/Cline to reload the MCP configuration
   - The GitHub MCP server should now connect successfully

3. **Test the Connection**:
   - Try using GitHub-related commands in Claude/Cline
   - You should now be able to:
     - Search repositories
     - Create repositories
     - Manage issues and pull requests
     - Access file contents from GitHub repos
     - And more GitHub operations

## Quick Test Commands to Try:
Once connected, you can test with commands like:
- "List my GitHub repositories"
- "Create a new repository called 'test-repo'"
- "Search for repositories related to 'machine learning'"

## Troubleshooting:
If you still see authentication errors:
- Double-check your token has the correct scopes
- Ensure the token is not expired
- Verify there are no extra spaces in the token string
- Try restarting Claude/Cline again

## Security Note:
- Keep your GitHub token secure and private
- Consider using the environment variable method for better security
- Never commit your actual token to version control
