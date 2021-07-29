import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

console.log('ops', vscode.commands);
vscode.commands.executeCommand('setContext', 'vcr-cleaner.supportedFiles', /.*_spec\.rb$/);

export function activate(context: vscode.ExtensionContext) {
	console.log('activated!');

	let destroyVcr = vscode.commands.registerCommand('vcr-cleaner.destroyVcr', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if(activeEditor){
			const { text: currentLine } = activeEditor.document.lineAt(activeEditor.selection.active.line);

			const [, vcrContext] = /(?:describe|context).*vcr.*['"](.*)['"]/mg.exec(currentLine) || [];
			if(vcrContext){
				deleteFile(vcrContext);
			}
		}
	});
	context.subscriptions.push(destroyVcr);

	let destroyAllVcr = vscode.commands.registerCommand('vcr-cleaner.destroyAllVcr', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if(activeEditor){
			const text = activeEditor.document.getText();
			const rex = /{\s*cassette_name\s*:\s*[\'\"](.*)[\"\']\s*}/g;
			const cassettes = text.match(rex);

			cassettes?.forEach(cassette=>{
				const vcrContext = cassette.replace(rex, '$1');

				if(vcrContext){
					deleteFile(vcrContext);
				}
			});
		}
	});
	context.subscriptions.push(destroyAllVcr);
}


async function deleteFile(vcrContext: string){
	const path = `spec/vcr/${vcrContext}.yml`;

	console.log(`loking for: ${path}`);

	const files = await vscode.workspace.findFiles(path);

	if(files.length === 1){
		const file = files[0];
		await vscode.workspace.fs.delete(file);
		await deleteFolders(file.path);
		vscode.window.showInformationMessage('VCR apagado!');
	}else{
		vscode.window.showInformationMessage('VCR não encontrado!');
	}
}

async function deleteFolders(filename: any) {
	const folder = path.parse(filename).dir;

	const emptyFolder = await isFolderEmpty(folder);

	if(emptyFolder){
		await vscode.workspace.fs.delete(vscode.Uri.file(folder), {recursive: true, useTrash: false});
	}
}

function isFolderEmpty(folder:string){
	return new Promise((resolve, reject) => {
		fs.readdir(folder, (err, files: string[]) => {
			if(err){ return reject(err); }

			console.log('>>>', folder, files, files.length);

			resolve(files.length === 0);
		});
	});
}

export function deactivate() {}
