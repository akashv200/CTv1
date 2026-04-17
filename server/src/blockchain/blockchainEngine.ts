import ganache from "ganache";
import solc from "solc";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ContractDeployment {
  address: string;
  abi: any;
  chainId: number;
}

class BlockchainEngine {
  private server: any;
  private provider: ethers.JsonRpcProvider | null = null;
  public contract: ethers.Contract | null = null;
  public deployment: ContractDeployment | null = null;
  private compiledData: { abi: any; bytecode: string } | null = null;

  async start() {
    console.log("[blockchain] Starting programmatic Ganache instance...");
    
    // 1. Start Ganache Server
    this.server = ganache.server({
      wallet: {
        mnemonic: "test test test test test test test test test test test junk",
        totalAccounts: 10
      },
      chain: {
        chainId: 5777,
        networkId: 5777
      },
      logging: {
        quiet: true
      }
    });

    await this.server.listen(7545);
    console.log("[blockchain] Ganache running on http://localhost:7545");

    this.provider = new ethers.JsonRpcProvider("http://localhost:7545");
    
    // 2. Compile once
    await this.compile();
    
    // 3. Optional: Deploy master contract for global usage if needed
    // In the new flow, we might skip this and only deploy per network
    await this.deploy();
  }

  private async compile() {
    try {
      console.log("[blockchain] Compiling smart contracts...");
      
      const rootPath = path.resolve(__dirname, "../../../");
      const blockchainPath = path.resolve(rootPath, "blockchain");
      
      const contractPath = path.resolve(blockchainPath, "contracts/UniversalTraceability.sol");
      const accessControlPath = path.resolve(blockchainPath, "contracts/AccessControl.sol");
      
      // Try to find OZ in local OR root node_modules (monorepo hoisting support)
      const findOzFile = (file: string) => {
        const local = path.resolve(blockchainPath, "node_modules", file);
        const root = path.resolve(rootPath, "node_modules", file);
        return fs.existsSync(local) ? fs.readFileSync(local, "utf8") : fs.readFileSync(root, "utf8");
      };

      const input = {
        language: "Solidity",
        sources: {
          "UniversalTraceability.sol": { content: fs.readFileSync(contractPath, "utf8") },
          "AccessControl.sol": { content: fs.readFileSync(accessControlPath, "utf8") },
          "@openzeppelin/contracts/access/Ownable.sol": { content: findOzFile("@openzeppelin/contracts/access/Ownable.sol") },
          "@openzeppelin/contracts/utils/Context.sol": { content: findOzFile("@openzeppelin/contracts/utils/Context.sol") }
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode"]
            }
          }
        }
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (output.errors) {
        const errors = output.errors.filter((e: any) => e.severity === "error");
        if (errors.length > 0) throw new Error(errors[0].message);
      }

      const contractData = output.contracts["UniversalTraceability.sol"]["UniversalTraceability"];
      this.compiledData = {
        abi: contractData.abi,
        bytecode: contractData.evm.bytecode.object
      };
      
      console.log("[blockchain] Compilation successful.");
    } catch (error) {
      console.error("[blockchain] Compilation failed:", error);
    }
  }

  public async deployNewInstance(): Promise<{ address: string; abi: any }> {
    if (!this.compiledData || !this.provider) {
      throw new Error("Blockchain engine not initialized or compiled.");
    }

    const signer = await this.provider.getSigner(0);
    const factory = new ethers.ContractFactory(this.compiledData.abi, this.compiledData.bytecode, signer);
    
    console.log("[blockchain] Deploying fresh UniversalTraceability instance...");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`[blockchain] New instance deployed at: ${address}`);

    return { address, abi: this.compiledData.abi };
  }

  private async deploy() {
    try {
      const { address, abi } = await this.deployNewInstance();
      
      this.contract = new ethers.Contract(address, abi, await this.provider!.getSigner(0));
      this.deployment = { address, abi, chainId: 5777 };

      // Update environment variables for the current process
      process.env.EVM_RPC_URL = "http://localhost:7545";
      process.env.TRACEABILITY_CONTRACT = address;
      process.env.EVM_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 

    } catch (error) {
      console.error("[blockchain] Master deployment failed:", error);
    }
  }

  async stop() {
    if (this.server) await this.server.close();
  }
}

export const blockchainEngine = new BlockchainEngine();
