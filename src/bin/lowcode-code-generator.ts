#!/usr/bin/env node
import program from 'commander';
import * as cli from '../cli';

program
  .command('generate', { isDefault: true })
  .description('Generate code from ali lowcode schema')
  .requiredOption('-s, --solution <solution>', 'specify the solution to use (icejs/rax/recore)')
  .option('-i, --input <input>', 'specify the input schema file')
  .option('-o, --output <output>', 'specify the output directory', 'generated')
  .option('-c, --cwd <cwd>', 'specify the working directory', '.')
  .option('-q, --quiet', 'be quiet, do not output anything unless get error', false)
  .option('-v, --verbose', 'be verbose, output more information', false)
  .arguments('[input-schema] ali lowcode schema JSON file')
  .action(function doGenerate(inputSchema: string, command: { opts: () => any }) {
    const options = command.opts();
    if (options.cwd) {
      process.chdir(options.cwd);
    }

    cli.run(inputSchema ? [inputSchema] : [], options).then((retCode) => {
      process.exit(retCode);
    });
  });

program
  .command('init-solution')
  .option('-c, --cwd <cwd>', 'specify the working directory', '.')
  .option('-q, --quiet', 'be quiet, do not output anything unless get error', false)
  .option('-v, --verbose', 'be verbose, output more information', false)
  .arguments('<your-solution-name>')
  .action(function initSolution(solutionName: string, command: { opts: () => any }) {
    const options = command.opts();
    if (options.cwd) {
      process.chdir(options.cwd);
    }

    cli.initSolution([solutionName], options).then((retCode) => {
      process.exit(retCode);
    });
  });

program.parse(process.argv);
