"use strict";

import { redirectUnregistered } from "./useful-for-client.js";

const employeeName = document.getElementById("employee-name");
const content = document.getElementsByTagName("main")[0];

redirectUnregistered(employeeName, content);