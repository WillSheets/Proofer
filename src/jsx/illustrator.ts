import {
  helloVoid,
  helloError,
  helloStr,
  helloNum,
  helloArrayStr,
  helloObj,
} from "./utils/samples";
export { helloError, helloStr, helloNum, helloArrayStr, helloObj, helloVoid };
import { dispatchTS } from "./utils/utils";

export const helloWorld = () => {
  alert("Hello from Illustrator");
};

// Include the proofer.jsx file
// @include './proofer.jsx'

// Export proofer functions to be accessible from CEP
export const createProof = (config: any) => {
  //@ts-ignore
  return prooferInterface.createProof(config);
};

export const loadPrefs = () => {
  //@ts-ignore
  return prooferInterface.loadPrefs();
};

export const savePrefs = (obj: any) => {
  //@ts-ignore
  return prooferInterface.savePrefs(obj);
};

export const setDefaultDir = () => {
  //@ts-ignore
  return prooferInterface.setDefaultDir();
};
