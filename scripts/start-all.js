const { spawn } = require("child_process");
const path = require("path");

// ANSI color escape codes for terminal outputs
const colors = {
  reset: "\x1b[0m",
  purple: "\x1b[35m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m"
};

const services = [
  {
    name: "AUTH-SERVICE",
    cmd: "node",
    args: [path.join(__dirname, "../services/auth/server.js")],
    color: colors.yellow
  },
  {
    name: "AI-SERVICE",
    cmd: "node",
    args: [path.join(__dirname, "../services/ai/server.js")],
    color: colors.cyan
  },
  {
    name: "BILLING-SERVICE",
    cmd: "node",
    args: [path.join(__dirname, "../services/billing/server.js")],
    color: colors.green
  },
  {
    name: "NEXTJS-GATEWAY",
    cmd: "npx",
    args: ["next", "dev", "-p", "3005"],
    color: colors.purple
  }
];

console.log(`${colors.cyan}=== TalkPrep AI: Starting Microservices Architecture ===${colors.reset}\n`);

const processes = [];

services.forEach(srv => {
  console.log(`Starting ${srv.color}${srv.name}${colors.reset}...`);
  
  // Set SHELL option true on Windows to ensure 'npx' can resolve correctly
  const p = spawn(srv.cmd, srv.args, {
    shell: true,
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" }
  });
  
  processes.push(p);

  p.stdout.on("data", data => {
    const lines = data.toString().trim().split("\n");
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${srv.color}[${srv.name}]${colors.reset} ${line}`);
      }
    });
  });

  p.stderr.on("data", data => {
    const lines = data.toString().trim().split("\n");
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${colors.red}[${srv.name}-ERR]${colors.reset} ${line}`);
      }
    });
  });

  p.on("close", code => {
    console.log(`${srv.color}[${srv.name}]${colors.reset} process exited with code ${code}`);
  });
});

// Graceful shutdown: kill all processes when manager is terminated
process.on("SIGINT", () => {
  console.log(`\n${colors.red}Shutting down all services...${colors.reset}`);
  processes.forEach(p => p.kill());
  process.exit();
});
process.on("SIGTERM", () => {
  processes.forEach(p => p.kill());
  process.exit();
});
