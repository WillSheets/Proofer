import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";

const config: CEP_Config = {
  version,
  id: "com.proofer.panel",
  displayName: "Proofer",
  symlink: "local",
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [
    { name: "ILST", version: "[17.0,99.9]" }, // Illustrator CC and later
  ],

  type: "Panel",
  iconDarkNormal: "./assets/icons/light-icon.png",
  iconNormal: "./assets/icons/dark-icon.png",
  iconDarkNormalRollOver: "./assets/icons/light-icon.png",
  iconNormalRollOver: "./assets/icons/dark-icon.png",
  parameters: ["--v=0", "--enable-nodejs", "--mixed-context"],
  width: 380,
  height: 500,

  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "Proofer",
      autoVisible: true,
      width: 380,
      height: 500,
    },
  ],
  build: {
    jsxBin: "off",
    sourceMap: true,
  },
  zxp: {
    country: "US",
    province: "CA",
    org: "Proofer",
    password: "password",
    tsa: [
      "http://timestamp.digicert.com/", // Windows Only
      "http://timestamp.apple.com/ts01", // MacOS Only
    ],
    allowSkipTSA: false,
    sourceMap: false,
    jsxBin: "off",
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: [],
};
export default config;
