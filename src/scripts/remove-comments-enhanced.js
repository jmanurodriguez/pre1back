

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dir: rootDir,
    includeExts: ['.js', '.css', '.handlebars', '.hbs'],
    excludeDirs: ['node_modules', '.git'],
    createBackup: true,
    generateReport: false
  };

  for (const arg of args) {
    if (arg.startsWith('--dir=')) {
      options.dir = path.resolve(arg.split('=')[1]);
    } else if (arg.startsWith('--include-exts=')) {
      options.includeExts = arg.split('=')[1].split(',').map(ext => ext.startsWith('.') ? ext : `.${ext}`);
    } else if (arg.startsWith('--exclude-dirs=')) {
      options.excludeDirs = arg.split('=')[1].split(',');
    } else if (arg === '--no-backup') {
      options.createBackup = false;
    } else if (arg === '--report') {
      options.generateReport = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
  Script para eliminar comentarios

  Uso: node remove-comments-enhanced.js [opciones]

  Opciones:
    --dir=path        Especifica un directorio específico para procesar (por defecto: src/)
    --include-exts    Lista de extensiones a incluir, separadas por comas (por defecto: js,css,handlebars,hbs)
    --exclude-dirs    Lista de directorios a excluir, separados por comas
    --no-backup       No crear una copia de seguridad antes de procesar
    --report          Genera un reporte detallado de comentarios eliminados
    --help, -h        Muestra esta ayuda
  `);
}

const COMMENT_PATTERNS = {
  jsLine: /\/\/.*?(?:\n|$)/g,
  block: /\/\*[\s\S]*?\*\//g,
  handlebars: /\{\{![\s\S]*?\}\}/g
};

const stats = {
  totalFiles: 0,
  processedFiles: 0,
  filesWithComments: 0,
  totalComments: 0,
  byExtension: {},
  byCommentType: {
    line: 0,
    block: 0,
    handlebars: 0
  }
};

function removeComments(content, extension) {
  let result = content;
  let lineCommentsCount = 0;
  let blockCommentsCount = 0;
  let handlebarsCommentsCount = 0;

  switch (extension) {
    case '.js':

      const blockMatches = content.match(COMMENT_PATTERNS.block) || [];
      blockCommentsCount = blockMatches.length;

      result = result.replace(COMMENT_PATTERNS.block, '');

      const lines = result.split('\n');
      const filteredLines = lines.map(line => {

        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {

          const beforeComment = line.substring(0, commentIndex);

          const quotes = (beforeComment.match(/"/g) || []).length;
          const singleQuotes = (beforeComment.match(/'/g) || []).length;

          if (quotes % 2 === 0 && singleQuotes % 2 === 0) {
            lineCommentsCount++;
            return line.substring(0, commentIndex);
          }
        }
        return line;
      });
      result = filteredLines.join('\n');
      break;

    case '.css':

      const cssBlockMatches = content.match(COMMENT_PATTERNS.block) || [];
      blockCommentsCount = cssBlockMatches.length;

      result = result.replace(COMMENT_PATTERNS.block, '');
      break;

    case '.handlebars':
    case '.hbs':

      const handlebarsMatches = content.match(COMMENT_PATTERNS.handlebars) || [];
      handlebarsCommentsCount = handlebarsMatches.length;

      result = result.replace(COMMENT_PATTERNS.handlebars, '');

      const hbsBlockMatches = result.match(COMMENT_PATTERNS.block) || [];
      blockCommentsCount = hbsBlockMatches.length;
      result = result.replace(COMMENT_PATTERNS.block, '');

      const hbsLines = result.split('\n');
      let lineCount = 0;
      const filteredHbsLines = hbsLines.map(line => {
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          const beforeComment = line.substring(0, commentIndex);
          const quotes = (beforeComment.match(/"/g) || []).length;
          const singleQuotes = (beforeComment.match(/'/g) || []).length;

          if (quotes % 2 === 0 && singleQuotes % 2 === 0) {
            lineCount++;
            return line.substring(0, commentIndex);
          }
        }
        return line;
      });

      lineCommentsCount = lineCount;
      result = filteredHbsLines.join('\n');
      break;
  }

  stats.byCommentType.line += lineCommentsCount;
  stats.byCommentType.block += blockCommentsCount;
  stats.byCommentType.handlebars += handlebarsCommentsCount;

  const totalCommentsInFile = lineCommentsCount + blockCommentsCount + handlebarsCommentsCount;
  stats.totalComments += totalCommentsInFile;

  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

  result = result.split('\n').map(line => line.trimRight()).join('\n');

  return {
    content: result,
    commentsRemoved: totalCommentsInFile
  };
}

async function processFile(filePath, options) {
  const extension = path.extname(filePath);

  if (!options.includeExts.includes(extension)) {
    return;
  }

  try {
    console.log(`Procesando archivo: ${filePath}`);
    stats.totalFiles++;
    stats.processedFiles++;

    if (!stats.byExtension[extension]) {
      stats.byExtension[extension] = {
        processed: 0,
        withComments: 0,
        totalComments: 0
      };
    }
    stats.byExtension[extension].processed++;

    const content = await fs.readFile(filePath, 'utf8');

    const { content: newContent, commentsRemoved } = removeComments(content, extension);

    if (commentsRemoved > 0) {
      await fs.writeFile(filePath, newContent);
      stats.filesWithComments++;
      stats.byExtension[extension].withComments++;
      stats.byExtension[extension].totalComments += commentsRemoved;

      console.log(`✓ Comentarios eliminados: ${filePath} (${commentsRemoved} comentarios)`);
    } else {
      console.log(`- No se encontraron comentarios en: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error al procesar ${filePath}: ${error.message}`);
  }
}

async function processDirectory(directory, options) {
  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {

        if (!options.excludeDirs.includes(file) && !file.startsWith('.')) {
          await processDirectory(filePath, options);
        }
      } else {
        await processFile(filePath, options);
      }
    }
  } catch (error) {
    console.error(`Error al procesar el directorio ${directory}: ${error.message}`);
  }
}

async function createBackup(sourceDir) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const dirName = path.basename(sourceDir);
  const backupDir = path.join(path.dirname(sourceDir), `${dirName}_backup_${timestamp}`);

  try {
    console.log(`Creando respaldo en: ${backupDir}`);

    const copyDir = async (src, dest) => {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyDir(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    await copyDir(sourceDir, backupDir);
    console.log('Respaldo creado exitosamente');
    return true;
  } catch (error) {
    console.error(`Error al crear respaldo: ${error.message}`);
    return false;
  }
}

async function generateReport() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(rootDir, `comment-removal-report-${timestamp}.txt`);

  let reportContent = `
=============================================
  REPORTE DE ELIMINACIÓN DE COMENTARIOS
=============================================
Fecha: ${new Date().toLocaleString()}

RESUMEN:
- Total de archivos procesados: ${stats.processedFiles}
- Archivos con comentarios eliminados: ${stats.filesWithComments}
- Total de comentarios eliminados: ${stats.totalComments}

TIPOS DE COMENTARIOS ELIMINADOS:
- Comentarios de línea: ${stats.byCommentType.line}
- Comentarios de bloque: ${stats.byCommentType.block}
- Comentarios de Handlebars: ${stats.byCommentType.handlebars}

ESTADÍSTICAS POR EXTENSIÓN:
`;

  for (const ext in stats.byExtension) {
    const extStats = stats.byExtension[ext];
    reportContent += `
- ${ext}:
  * Archivos procesados: ${extStats.processed}
  * Archivos con comentarios: ${extStats.withComments}
  * Total de comentarios eliminados: ${extStats.totalComments}
`;
  }

  await fs.writeFile(reportPath, reportContent);
  console.log(`\nReporte generado: ${reportPath}`);
}

async function main() {
  console.log('=== Script para eliminar comentarios (versión mejorada) ===');

  const options = parseArgs();

  console.log('\nConfigiuración:');
  console.log(`- Directorio a procesar: ${options.dir}`);
  console.log(`- Extensiones incluidas: ${options.includeExts.join(', ')}`);
  console.log(`- Directorios excluidos: ${options.excludeDirs.join(', ')}`);
  console.log(`- Crear respaldo: ${options.createBackup ? 'Sí' : 'No'}`);
  console.log(`- Generar reporte: ${options.generateReport ? 'Sí' : 'No'}\n`);

  let continueProcessing = true;
  if (options.createBackup) {
    const backupCreated = await createBackup(options.dir);
    if (!backupCreated) {
      console.error('No se pudo crear el respaldo. Cancelando operación.');
      continueProcessing = false;
    }
  }

  if (continueProcessing) {
    console.log('\nIniciando procesamiento...');
    await processDirectory(options.dir, options);
    console.log('\nProcesamiento completado');

    if (options.generateReport) {
      await generateReport();
    }

    console.log(`\nEstadísticas finales:`);
    console.log(`- Archivos procesados: ${stats.processedFiles}`);
    console.log(`- Archivos con comentarios eliminados: ${stats.filesWithComments}`);
    console.log(`- Total de comentarios eliminados: ${stats.totalComments}`);
  }
}

main().catch(console.error);
