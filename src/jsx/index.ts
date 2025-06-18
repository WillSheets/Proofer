// @include './lib/json2.js'

import { ns } from "../shared/shared";
import * as ilst from "./illustrator";

//@ts-ignore
const host = typeof $ !== "undefined" ? $ : window;

// Export Illustrator functions to the host
host[ns] = ilst;

export type Scripts = typeof ilst;
