import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// Extensiones de archivos a procesar
const extensions = ['.js', '.json', '.handlebars', '.css', '.html'];

// Archivos y carpetas a ignorar
const ignoreList = [
  'node_modules',
  '.git',
  '.env',
  'package-lock.json',
  'scripts',
  'README.md'
];

// Contador para estadísticas
const stats = {
  filesProcessed: 0,
  commentsRemoved: 0
};

/**
 * Elimina comentarios de un archivo JavaScript
 * @param {string} content - Contenido del archivo
 * @returns {string} - Contenido sin comentarios
 */
function removeJsComments(content) {
  let originalLength = content.length;
  let inString = false;
  let inComment = false;
  let inMultiLineComment = false;
  let newContent = '';
  let stringChar = '';
  let i = 0;
  
  while (i < content.length) {
    // Dentro de una cadena
    if (inString) {
      newContent += content[i];
      if (content[i] === '\\' && i + 1 < content.length) {
        // Carácter de escape en cadena
        newContent += content[i + 1];
        i += 2;
        continue;
      }
      if (content[i] === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }
    
    // Inicio de un comentario de línea
    if (!inComment && !inMultiLineComment && content[i] === '/' && content[i + 1] === '/') {
      inComment = true;
      i += 2;
      continue;
    }
    
    // Inicio de un comentario multilínea
    if (!inComment && !inMultiLineComment && content[i] === '/' && content[i + 1] === '*') {
      // Conservar comentarios JSDoc (/**) que son importantes para documentación
      if (content[i + 2] === '*') {
        newContent += '/**';
        i += 3;
        inMultiLineComment = true;
        continue;
      }
      inMultiLineComment = true;
      i += 2;
      continue;
    }
    
    // Fin de un comentario de línea
    if (inComment && (content[i] === '\n' || content[i] === '\r')) {
      inComment = false;
      newContent += content[i];
      i++;
      continue;
    }
    
    // Fin de un comentario multilínea
    if (inMultiLineComment && content[i] === '*' && content[i + 1] === '/') {
      inMultiLineComment = false;
      i += 2;
      continue;
    }
    
    // No estamos en un comentario, agregamos el carácter
    if (!inComment && !inMultiLineComment) {
      // Inicio de una cadena
      if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
        inString = true;
        stringChar = content[i];
      }
      newContent += content[i];
    }
    
    i++;
  }
  
  // Contar comentarios eliminados
  stats.commentsRemoved += (originalLength - newContent.length);
  
  // Eliminar líneas vacías múltiples
  newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return newContent;
}

/**
 * Elimina comentarios HTML <!-- --> en archivos handlebars
 * @param {string} content - Contenido del archivo
 * @returns {string} - Contenido sin comentarios HTML
 */
function removeHtmlComments(content) {
  let originalLength = content.length;
  const newContent = content.replace(/<!--[\s\S]*?-->/g, '');
  stats.commentsRemoved += (originalLength - newContent.length);
  return newContent;
}

/**
 * Procesa un archivo para eliminar comentarios
 * @param {string} filePath - Ruta del archivo a procesar
 */
function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!extensions.includes(ext)) return;
  
  try {
    console.log(`Procesando: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Procesar según extensión
    if (['.js', '.json'].includes(ext)) {
      newContent = removeJsComments(content);
    }
    
    if (['.handlebars', '.html'].includes(ext)) {
      // Primero eliminar comentarios JavaScript si hay scripts
      newContent = removeJsComments(content);
      // Luego eliminar comentarios HTML
      newContent = removeHtmlComments(newContent);
    }
    
    if (ext === '.css') {
      // Eliminar comentarios CSS /* */
      const originalLength = content.length;
      newContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
      stats.commentsRemoved += (originalLength - newContent.length);
    }
    
    // Guardar solo si se hicieron cambios
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      stats.filesProcessed++;
    }
  } catch (error) {
    console.error(`Error al procesar ${filePath}: ${error.message}`);
  }
}

/**
 * Recorre recursivamente un directorio y procesa cada archivo
 * @param {string} dir - Directorio a procesar
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Saltar elementos en la lista de ignorados
    if (ignoreList.some(ignore => fullPath.includes(ignore))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

// Ejecutar el script
console.log('Iniciando eliminación de comentarios...');
processDirectory(rootDir);
console.log(`\nResumen:`);
console.log(`- Archivos procesados: ${stats.filesProcessed}`);
console.log(`- Comentarios eliminados: ~${stats.commentsRemoved} caracteres`);
console.log('\nProceso completado.');