import { spawn } from "node:child_process"
import { existsSync, renameSync, unlinkSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const command = process.argv[2]
const nextArgs = process.argv.slice(3)
const localEnvPath = path.join(rootDir, ".env.local")
const backupEnvPath = path.join(rootDir, ".env.local.__next-dev-backup__")

function restoreLocalEnv() {
  if (existsSync(backupEnvPath)) {
    if (!existsSync(localEnvPath)) {
      renameSync(backupEnvPath, localEnvPath)
      return
    }

    unlinkSync(backupEnvPath)
  }
}

if (command !== "dev") {
  const nextCli = path.join(rootDir, "node_modules", "next", "dist", "bin", "next")
  const child = spawn(process.execPath, [nextCli, command, ...nextArgs], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  })

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })

  process.on("SIGINT", () => child.kill("SIGINT"))
  process.on("SIGTERM", () => child.kill("SIGTERM"))
} else {
  if (existsSync(backupEnvPath)) {
    restoreLocalEnv()
  }

  if (existsSync(localEnvPath)) {
    renameSync(localEnvPath, backupEnvPath)
  }

  const nextCli = path.join(rootDir, "node_modules", "next", "dist", "bin", "next")
  const child = spawn(process.execPath, [nextCli, "dev", ...nextArgs], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  })

  let cleanedUp = false

  function cleanup(exitCode = 0) {
    if (cleanedUp) {
      return
    }

    cleanedUp = true
    restoreLocalEnv()
    process.exit(exitCode)
  }

  child.on("exit", (code, signal) => {
    if (signal) {
      cleanup(128)
      return
    }

    cleanup(code ?? 0)
  })

  process.on("SIGINT", () => {
    child.kill("SIGINT")
    cleanup(130)
  })

  process.on("SIGTERM", () => {
    child.kill("SIGTERM")
    cleanup(143)
  })

  process.on("exit", restoreLocalEnv)
}