import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('activated!');

	let destroyVcr = vscode.commands.registerCommand('vcr-cleaner.destroyVcr', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if(activeEditor){
			const { text: currentLine } = activeEditor.document.lineAt(activeEditor.selection.active.line);

			const [, vcrContext] = /(?:describe|context).*vcr.*['"](.*)['"]/mg.exec(currentLine) || [];
			if(vcrContext){
				const vcrPath = `spec/${vcrContext}.vcr`;

				deleteFile(vcrPath);
			}

		}
	});
	context.subscriptions.push(destroyVcr);
}


async function deleteFile(path: string){
	console.log(`loking for: ${path}`);

	const files = await vscode.workspace.findFiles(path);

	if(files.length === 1){
		const file = files[0];
		await vscode.workspace.fs.delete(file);

		vscode.window.showInformationMessage('VCR apagado!');
	}else{
		vscode.window.showInformationMessage('VCR não encontrado!');
	}
}

export function deactivate() {}
