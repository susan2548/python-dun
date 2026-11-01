// Neon HTTP executes one prepared statement per request. Preserve function bodies.
export function sqlStatements(source){
 const tokens=/--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\$\$[\s\S]*?\$\$|;/g;
 let start=0;const result=[];
 for(const match of source.matchAll(tokens))if(match[0]===';'){result.push(source.slice(start,match.index+1));start=match.index+1;}
 const tail=source.slice(start).trim();if(tail&&!/^--[^\n]*$/.test(tail))result.push(tail);
 return result.filter(s=>s.trim());
}
