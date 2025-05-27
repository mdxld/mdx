# Testing Slash Commands

The chat CLI now uses slash commands instead of single keystrokes to avoid conflicts.

## Available Commands:

1. `/web` - Toggle web search
2. `/reasoning` or `/r` - Toggle reasoning display
3. `/mcp` or `/m` - Toggle MCP source manager
4. `/tools` or `/t` - Toggle MCP tools
5. `/help` or `/h` - Show help message

## Test Cases:

1. **Normal typing**: Type "write a function to calculate the nth prime" - should work without triggering commands
2. **Web toggle**: Type `/web` and press Enter - should toggle web search
3. **Help command**: Type `/help` and press Enter - should show available commands
4. **Reasoning toggle**: Type `/r` and press Enter - should toggle reasoning display
5. **Invalid command**: Type `/invalid` and press Enter - should show error message

## Expected Behavior:

- Letters like 'w', 'r', 'm', 't' should NOT trigger commands when typing normally
- Only commands prefixed with '/' should trigger special actions
- Ctrl+C should still exit the application
- Normal chat messages should work as before
