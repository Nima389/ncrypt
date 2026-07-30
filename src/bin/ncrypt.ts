#!/usr/bin/env node

import {Command} from "commander";
import {runInteractivePack} from "../cli/pack.js";
import {runInteractiveUnpack} from "../cli/unpack.js";

const program = new Command();

program
  .name("ncrypt")
  .description("Fast, encrypted binary container CLI (.ncrypt)")
  .version("1.0.0");

program
  .command("pack [source]")
  .alias("c")
  .description("Pack a file into an .ncrypt container")
  .option("-a, --algo <algorithm>", "Encryption algorithm")
  .option("-p, --password <password>", "Password")
  .option("-o, --output <path>", "Output destination")
  .action(runInteractivePack);

program
  .command("unpack [file]")
  .alias("x")
  .description("Unpack an .ncrypt file")
  .option("-p, --password <password>", "Password")
  .option("-o, --output <path>", "Output destination")
  .action(runInteractiveUnpack);

program.parse(process.argv);
