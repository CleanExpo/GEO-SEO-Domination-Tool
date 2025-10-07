'use client';

import { useState } from 'react';
import { Play, Code, Terminal, FileCode, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  success: boolean;
}

export default function SandboxPage() {
  const [code, setCode] = useState(`// Write your JavaScript code here
console.log('Hello from Sandbox!');

// Example: Calculate fibonacci
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));
`);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCode = async () => {
    setIsExecuting(true);
    const startTime = performance.now();

    // Create a safe console.log capture
    const logs: string[] = [];
    const originalConsoleLog = console.log;

    try {
      // Override console.log to capture output
      console.log = (...args: any[]) => {
        logs.push(args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      // Execute code in eval (note: this is a simple sandbox, not production-ready)
      eval(code);

      const executionTime = performance.now() - startTime;

      setResult({
        output: logs.join('\n') || 'No output',
        executionTime,
        success: true,
      });
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      setResult({
        output: logs.join('\n') || '',
        error: error.message,
        executionTime,
        success: false,
      });
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
      setIsExecuting(false);
    }
  };

  const clearOutput = () => {
    setResult(null);
  };

  const loadExample = (example: string) => {
    const examples: Record<string, string> = {
      fibonacci: `// Fibonacci sequence generator
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence (0-10):');
for (let i = 0; i <= 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`,
      array: `// Array manipulation examples
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log('Original:', numbers);
console.log('Doubled:', numbers.map(n => n * 2));
console.log('Even only:', numbers.filter(n => n % 2 === 0));
console.log('Sum:', numbers.reduce((a, b) => a + b, 0));
console.log('Max:', Math.max(...numbers));`,
      object: `// Object manipulation
const user = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  skills: ['JavaScript', 'React', 'Node.js']
};

console.log('User:', user);
console.log('Skills:', user.skills.join(', '));

// Destructuring
const { name, age } = user;
console.log(\`\${name} is \${age} years old\`);`,
      async: `// Async/await example (simulated)
function delay(ms) {
  // Note: Real async operations won't work in this sandbox
  console.log(\`Simulating \${ms}ms delay...\`);
  return Promise.resolve('Completed');
}

console.log('Starting async operation...');
delay(1000).then(result => console.log('Result:', result));
console.log('Async operation initiated');`
    };

    setCode(examples[example] || code);
    clearOutput();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Terminal className="h-8 w-8 text-emerald-600" />
          Code Sandbox
        </h1>
        <p className="text-gray-600 mt-2">Test and experiment with JavaScript code in a safe environment</p>
      </div>

      {/* Example Templates */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => loadExample('fibonacci')}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          Fibonacci Example
        </button>
        <button
          onClick={() => loadExample('array')}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
        >
          Array Methods
        </button>
        <button
          onClick={() => loadExample('object')}
          className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-sm font-medium"
        >
          Objects
        </button>
        <button
          onClick={() => loadExample('async')}
          className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
        >
          Async Example
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <FileCode className="h-5 w-5" />
              <span className="font-semibold">Code Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearOutput}
                className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Output
              </button>
              <button
                onClick={executeCode}
                disabled={isExecuting}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 focus:outline-none focus:bg-white transition-colors resize-none"
            placeholder="Write your JavaScript code here..."
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 text-white">
            <Terminal className="h-5 w-5" />
            <span className="font-semibold">Output</span>
          </div>
          <div className="p-4 h-[500px] overflow-y-auto bg-gray-50">
            {result ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Success</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">Error</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-500 ml-auto">
                    Executed in {result.executionTime.toFixed(2)}ms
                  </span>
                </div>

                {/* Output */}
                {result.output && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold uppercase">Console Output</div>
                    <pre className="bg-white border border-gray-200 rounded-lg p-3 text-sm font-mono overflow-x-auto">
                      {result.output}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {result.error && (
                  <div>
                    <div className="text-xs text-red-500 mb-2 font-semibold uppercase">Error Details</div>
                    <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-mono text-red-700 overflow-x-auto">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Code className="h-16 w-16 mb-4" />
                <p className="text-sm">Click "Run Code" to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Quick Testing</h3>
          </div>
          <p className="text-sm text-gray-600">
            Test JavaScript snippets instantly without setting up a full development environment.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Code className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Learn & Experiment</h3>
          </div>
          <p className="text-sm text-gray-600">
            Try out new JavaScript features, test algorithms, and experiment with code patterns.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Terminal className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Console Output</h3>
          </div>
          <p className="text-sm text-gray-600">
            See console.log outputs and error messages in real-time with execution metrics.
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Sandbox Environment</h4>
            <p className="text-sm text-gray-600">
              This is a client-side sandbox for testing JavaScript code. Some features like HTTP requests,
              file system access, and DOM manipulation may be limited. Do not execute untrusted code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
