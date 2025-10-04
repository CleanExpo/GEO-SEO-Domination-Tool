# Build an MCP Server - Complete Guide

## Overview
This guide provides comprehensive instructions for building Model Context Protocol (MCP) servers across multiple languages. MCP servers enable AI assistants like Claude to access external tools, resources, and prompts.

## Core MCP Concepts

### Three Main Capabilities

1. **Resources**: File-like data that can be read by clients (like API responses or file contents)
2. **Tools**: Functions that can be called by the LLM (with user approval)
3. **Prompts**: Pre-written templates that help users accomplish specific tasks

## Critical Logging Requirements

### STDIO-based Servers
**NEVER write to standard output (stdout)**. This includes:
- `print()` statements in Python
- `console.log()` in JavaScript
- `fmt.Println()` in Go
- Similar stdout functions in other languages

Writing to stdout will corrupt the JSON-RPC messages and break your server.

### HTTP-based Servers
Standard output logging is fine since it doesn't interfere with HTTP responses.

### Best Practices

**Python:**
```python
# ❌ Bad (STDIO)
print("Processing request")

# ✅ Good (STDIO)
import logging
logging.info("Processing request")
```

**JavaScript:**
```javascript
// ❌ Bad (STDIO)
console.log("Server started");

// ✅ Good (STDIO)
console.error("Server started"); // stderr is safe
```

## Python Implementation

### System Requirements
- Python 3.10 or higher
- Python MCP SDK 1.2.0 or higher

### Setup Environment

**macOS/Linux:**
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
uv init weather
cd weather

# Create virtual environment and activate
uv venv
source .venv/bin/activate

# Install dependencies
uv add "mcp[cli]" httpx

# Create server file
touch weather.py
```

**Windows:**
```powershell
# Install uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Create project
uv init weather
cd weather

# Create virtual environment and activate
uv venv
.venv\Scripts\activate

# Install dependencies
uv add mcp[cli] httpx

# Create server file
new-item weather.py
```

### Building the Server

**Importing packages:**
```python
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"
```

**Helper functions:**
```python
async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""
```

**Tool implementation:**
```python
@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)
```

**Running the server:**
```python
def main():
    # Initialize and run the server
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

**Start server:**
```bash
uv run weather.py
```

## TypeScript/Node.js Implementation

### System Requirements
- Node.js version 16 or higher

### Setup Environment

```bash
# Verify Node.js installation
node --version
npm --version

# Create project
mkdir weather
cd weather

# Initialize npm project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk zod@3
npm install -D @types/node typescript

# Create files
mkdir src
touch src/index.ts
```

### Package.json Configuration

```json
{
  "type": "module",
  "bin": {
    "weather": "./build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js"
  },
  "files": ["build"]
}
```

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Building the Server

**Importing packages:**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});
```

**Helper functions:**
```typescript
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}
```

**Tool registration:**
```typescript
server.tool(
  "get_alerts",
  "Get weather alerts for a state",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const features = alertsData.features || [];
    if (features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No active alerts for ${stateCode}`,
          },
        ],
      };
    }

    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  },
);
```

**Running the server:**
```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

**Build and run:**
```bash
npm run build
```

## Java/Spring AI Implementation

### System Requirements
- Java 17 or higher
- Spring Boot 3.3.x or higher

### Setup with Spring Initializer

Use [Spring Initializer](https://start.spring.io/) to bootstrap the project.

**Maven dependencies:**
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-mcp-server</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-web</artifactId>
    </dependency>
</dependencies>
```

**Gradle dependencies:**
```groovy
dependencies {
  implementation platform("org.springframework.ai:spring-ai-starter-mcp-server")
  implementation platform("org.springframework:spring-web")
}
```

### Application Configuration

**application.properties:**
```properties
spring.main.bannerMode=off
logging.pattern.console=
```

**application.yml:**
```yaml
logging:
  pattern:
    console:
spring:
  main:
    banner-mode: off
```

### Weather Service Implementation

```java
@Service
public class WeatherService {

    private final RestClient restClient;

    public WeatherService() {
        this.restClient = RestClient.builder()
            .baseUrl("https://api.weather.gov")
            .defaultHeader("Accept", "application/geo+json")
            .defaultHeader("User-Agent", "WeatherApiClient/1.0 (your@email.com)")
            .build();
    }

  @Tool(description = "Get weather forecast for a specific latitude/longitude")
  public String getWeatherForecastByLocation(
      double latitude,   // Latitude coordinate
      double longitude   // Longitude coordinate
  ) {
      // Implementation returns detailed forecast
  }

  @Tool(description = "Get weather alerts for a US state")
  public String getAlerts(
      @ToolParam(description = "Two-letter US state code (e.g. CA, NY)") String state
  ) {
      // Implementation returns active alerts
  }
}
```

### Boot Application

```java
@SpringBootApplication
public class McpServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(McpServerApplication.class, args);
    }

    @Bean
    public ToolCallbackProvider weatherTools(WeatherService weatherService) {
        return  MethodToolCallbackProvider.builder().toolObjects(weatherService).build();
    }
}
```

**Build:**
```bash
./mvnw clean install
```

## Kotlin Implementation

### System Requirements
- Java 17 or higher
- Gradle

### Dependencies

**build.gradle.kts:**
```kotlin
val mcpVersion = "0.4.0"
val slf4jVersion = "2.0.9"
val ktorVersion = "3.1.1"

dependencies {
    implementation("io.modelcontextprotocol:kotlin-sdk:$mcpVersion")
    implementation("org.slf4j:slf4j-nop:$slf4jVersion")
    implementation("io.ktor:ktor-client-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
}

plugins {
    kotlin("plugin.serialization") version "your_version_of_kotlin"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}
```

### Server Implementation

```kotlin
// Main function to run the MCP server
fun `run mcp server`() {
    // Create the MCP Server instance
    val server = Server(
        Implementation(
            name = "weather",
            version = "1.0.0"
        ),
        ServerOptions(
            capabilities = ServerCapabilities(tools = ServerCapabilities.Tools(listChanged = true))
        )
    )

    // Create a transport using standard IO
    val transport = StdioServerTransport(
        System.`in`.asInput(),
        System.out.asSink().buffered()
    )

    runBlocking {
        server.connect(transport)
        val done = Job()
        server.onClose {
            done.complete()
        }
        done.join()
    }
}
```

**Build:**
```bash
./gradlew build
```

## C# Implementation

### System Requirements
- .NET 8 SDK or higher

### Setup

```bash
# Verify dotnet installation
dotnet --version

# Create project
mkdir weather
cd weather
dotnet new console

# Add NuGet packages
dotnet add package ModelContextProtocol --prerelease
dotnet add package Microsoft.Extensions.Hosting
```

### Program.cs

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ModelContextProtocol;
using System.Net.Http.Headers;

var builder = Host.CreateEmptyApplicationBuilder(settings: null);

builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

builder.Services.AddSingleton(_ =>
{
    var client = new HttpClient() { BaseAddress = new Uri("https://api.weather.gov") };
    client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("weather-tool", "1.0"));
    return client;
});

var app = builder.Build();

await app.RunAsync();
```

### Weather Tools

```csharp
using ModelContextProtocol.Server;
using System.ComponentModel;

namespace QuickstartWeatherServer.Tools;

[McpServerToolType]
public static class WeatherTools
{
    [McpServerTool, Description("Get weather alerts for a US state.")]
    public static async Task<string> GetAlerts(
        HttpClient client,
        [Description("The US state to get alerts for.")] string state)
    {
        // Implementation
    }

    [McpServerTool, Description("Get weather forecast for a location.")]
    public static async Task<string> GetForecast(
        HttpClient client,
        [Description("Latitude of the location.")] double latitude,
        [Description("Longitude of the location.")] double longitude)
    {
        // Implementation
    }
}
```

**Run:**
```bash
dotnet run
```

## Testing with Claude for Desktop

### Configuration Location

**macOS/Linux:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
%AppData%\Claude\claude_desktop_config.json
```

### Configuration Examples

**Python:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": [
        "--directory",
        "/ABSOLUTE/PATH/TO/PARENT/FOLDER/weather",
        "run",
        "weather.py"
      ]
    }
  }
}
```

**Node.js:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PARENT/FOLDER/weather/build/index.js"]
    }
  }
}
```

**Java:**
```json
{
  "mcpServers": {
    "spring-ai-mcp-weather": {
      "command": "java",
      "args": [
        "-Dspring.ai.mcp.server.stdio=true",
        "-jar",
        "/ABSOLUTE/PATH/TO/PARENT/FOLDER/mcp-weather-stdio-server-0.0.1-SNAPSHOT.jar"
      ]
    }
  }
}
```

**Kotlin:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "java",
      "args": [
        "-jar",
        "/ABSOLUTE/PATH/TO/PARENT/FOLDER/weather/build/libs/weather-0.1.0-all.jar"
      ]
    }
  }
}
```

**C#:**
```json
{
  "mcpServers": {
    "weather": {
      "command": "dotnet",
      "args": ["run", "--project", "/ABSOLUTE/PATH/TO/PROJECT", "--no-build"]
    }
  }
}
```

### Testing Commands

After configuration and restarting Claude for Desktop, test with:

- "What's the weather in Sacramento?"
- "What are the active weather alerts in Texas?"

### Visual Indicators

Look for the "Search and tools" icon in Claude for Desktop. Clicking it should show the registered tools.

## How It Works

1. Client sends your question to Claude
2. Claude analyzes available tools and decides which to use
3. Client executes chosen tool(s) through MCP server
4. Results are sent back to Claude
5. Claude formulates natural language response
6. Response is displayed to you

## Troubleshooting

### Claude for Desktop Integration

**Check logs:**

**macOS/Linux:**
```bash
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

**Common issues:**

1. **Server not showing up:**
   - Check `claude_desktop_config.json` syntax
   - Verify absolute paths (not relative)
   - Restart Claude for Desktop completely

2. **Tool calls failing:**
   - Check Claude's logs for errors
   - Verify server builds and runs without errors
   - Try restarting Claude for Desktop

### Weather API Issues

**Failed to retrieve grid point data:**
- Coordinates must be within the US
- Check NWS API status
- Add delay between requests to avoid rate limiting

**No active alerts:**
- Not an error - just means no current alerts
- Try different state or check during severe weather

## Application to GEO-SEO Tool

### Potential MCP Servers for SEO

1. **SEO Audit Server**
   - Tool: `run_technical_audit`
   - Tool: `check_mobile_performance`
   - Tool: `analyze_page_speed`
   - Resource: SEO audit templates

2. **Keyword Research Server**
   - Tool: `find_keyword_opportunities`
   - Tool: `analyze_serp_competition`
   - Tool: `get_search_volume`
   - Resource: Keyword databases

3. **Competitor Analysis Server**
   - Tool: `analyze_competitor_keywords`
   - Tool: `track_competitor_rankings`
   - Tool: `compare_backlink_profiles`
   - Resource: Competitor data

4. **Local SEO Server**
   - Tool: `check_gbp_status`
   - Tool: `analyze_local_citations`
   - Tool: `track_local_rankings`
   - Resource: Local business data

5. **Content Optimization Server**
   - Tool: `analyze_content_quality`
   - Tool: `suggest_content_improvements`
   - Tool: `generate_meta_tags`
   - Prompt: Content optimization templates

### Integration Benefits

- **Modular Architecture**: Separate servers for different SEO functions
- **AI-Powered Analysis**: Claude can intelligently use tools based on context
- **Extensibility**: Easy to add new tools and capabilities
- **Type Safety**: Strong typing across all implementations
- **Cross-Platform**: Build servers in the language that fits the task

## Next Steps

1. **Building a Client**: Learn to build MCP clients that connect to servers
2. **Example Servers**: Explore official MCP server implementations
3. **Debugging Guide**: Master MCP debugging techniques
4. **Building with LLMs**: Use Claude to accelerate MCP development

---

**Source**: https://modelcontextprotocol.io/docs/develop/build-server
**Complete Code Examples**:
- Python: https://github.com/modelcontextprotocol/quickstart-resources/tree/main/weather-server-python
- TypeScript: https://github.com/modelcontextprotocol/quickstart-resources/tree/main/weather-server-typescript
- Java: https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/starter-stdio-server
- Kotlin: https://github.com/modelcontextprotocol/kotlin-sdk/tree/main/samples/weather-stdio-server
- C#: https://github.com/modelcontextprotocol/csharp-sdk/tree/main/samples/QuickstartWeatherServer

**Last Updated**: 2025-01-03
