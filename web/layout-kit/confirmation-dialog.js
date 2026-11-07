/** Optional native HTML dialog adapter for a UIWorkflow confirmation queue.
 * Uses built-in focus trapping and Escape behavior; no game-specific styling.
 */
export class ConfirmationDialogAdapter {
 constructor({dialog,workflow,title,message,confirmButton,cancelButton,formatPrompt}={}){
  if(!dialog||typeof dialog.showModal!=='function'||typeof dialog.close!=='function')throw new TypeError('Native dialog required');
  if(!workflow||typeof workflow.handle!=='function'||!workflow.confirmation)throw new TypeError('UI workflow required');
  if(!confirmButton||!cancelButton)throw new TypeError('Confirm and cancel controls required');
  this.dialog=dialog;this.workflow=workflow;this.title=title;this.message=message;
  this.confirmButton=confirmButton;this.cancelButton=cancelButton;
  this.formatPrompt=formatPrompt??(pending=>({
   title:'Confirm action',
   message:'Approve '+pending.actionId+'?'
  }));
  this.approve=()=>{
   this.workflow.handle('ui.confirm');
   if(this.dialog.open)this.dialog.close('confirmed');
  };
  this.reject=()=>{
   this.workflow.handle('ui.cancel');
   if(this.dialog.open)this.dialog.close('cancelled');
  };
  this.onCancel=()=>{
   // Native Escape fires "cancel" before "close".
   this.workflow.handle('ui.cancel');
  };
  confirmButton.addEventListener('click',this.approve);
  cancelButton.addEventListener('click',this.reject);
  dialog.addEventListener('cancel',this.onCancel);
 }
 sync(){
  const pending=this.workflow.confirmation.snapshot();
  if(!pending){
   if(this.dialog.open)this.dialog.close();
   return;
  }
  const content=this.formatPrompt(pending);
  if(this.title)this.title.textContent=String(content.title??'Confirm action');
  if(this.message)this.message.textContent=String(content.message??'Are you sure?');
  if(!this.dialog.open)this.dialog.showModal();
 }
 destroy(){
  this.confirmButton.removeEventListener('click',this.approve);
  this.cancelButton.removeEventListener('click',this.reject);
  this.dialog.removeEventListener('cancel',this.onCancel);
  if(this.dialog.open)this.dialog.close();
 }
}
