import {Component} from '@angular/core';
import {NodeService} from '../../../d3/models/node.service';
import {Subscription} from 'rxjs';
import {Message, MessageService} from '../../../services/message.service';
import {DataConnectionService} from '../../../services/data-connection.service';
import {NodeMenuControllerService} from '../../../services/node-menu-controller.service';
import {GraphDataService} from '../../../services/graph-data.service';
import {SettingsService, Settings} from '../../../services/settings.service';
import {LoadingService} from '../../../services/loading.service';
import {Node} from '../../../d3/models/node';
import {NodeExpandService, Expand} from '../../../services/node-expand.service';


@Component({
  selector: '[menu-list]',
  template: `
<svg:foreignObject class="foreignObjectMenu" [attr.x]="clickedNode.x" [attr.y]="clickedNode.y" width="25%" height="100%" *ngIf="openMenu" >
 <xhtml:div xmlns="http:// www.w3.org/1999/xhtml" class="node-menu">
  <mat-action-list>
    <button mat-menu-item class = "expand-list" fxLayoutAlign="end center"  (click)="closeMenu()"><span><mat-icon>clear</mat-icon></span></button>
    <button mat-menu-item class = "expand-list" [disabled]="true"><b>{{label}}</b></button>
    <button mat-menu-item class = "expand-list" *ngIf="!expanded.target" (click)="expand('Target')" [disabled]="!counts.target">Expand Targets {{counts?.target}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="expanded.target===true" (click)="collapse('Target')" [disabled]="!counts.target">Collapse Targets {{counts?.target}}</button>
    <button mat-menu-item class = "expand-list"  *ngIf="!expanded.compound" (click)="expand('Compound')" [disabled]="!counts.compound">Expand Compounds {{counts?.compound}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="expanded.compound===true" (click)="collapse('Compound')" [disabled]="!counts.compound">Collapse Compounds {{counts?.compound}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="!expanded.pattern" (click)="expand('Pattern')" [disabled]="!counts.pattern">Expand Patterns {{counts?.pattern}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="expanded.pattern===true" (click)="collapse('Pattern')" [disabled]="!counts.pattern">Collapse Patterns {{counts?.pattern}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="!expanded.all" (click)="expand('All')">Expand All {{counts?.total}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="expanded.all===true" (click)="collapse('All')">Collapse All {{counts?.total}}</button>
    <button mat-menu-item class = "expand-list" *ngIf="clickedNode.labels[0]=='Target' && !expanded.predictions" (click)="expand('Predictions')">Get Predictions</button>
    <button mat-menu-item class = "expand-list" *ngIf="expanded.predictions===true" (click)="collapse('Predictions')">Remove Predictions</button>
  </mat-action-list>
</xhtml:div>
</svg:foreignObject>
`,
  styleUrls: ['./node-menu.component.scss']
})
export class NodeMenuComponent {
  clickedNode: Node;
  counts: any = {total: 0};
  subscription: Subscription;
  settings: Settings;
  label: string;
  openMenu = false;
  expanded: Expand = new Expand();

 constructor(
   private nodeService: NodeService,
  private dataConnectionService: DataConnectionService,
  private messageService: MessageService,
   private nodeMenuController: NodeMenuControllerService,
   private graphDataService: GraphDataService,
   public settingsService: SettingsService,
   public nodeExpandService: NodeExpandService,
   private loadingService: LoadingService
 ) { }



  ngOnInit() {
    // this only gets the count of the nodes
    this.nodeService.clickednode$.subscribe(node => {
      this.clickedNode = node;
      if (this.clickedNode.uuid) {
        this.counts = {total: 0};
        const message: Message = this.messageService.getMessage(this.clickedNode.uuid, 'counts', this.clickedNode.labels[0]);
        this.dataConnectionService.messages.next(message);
        this.expanded = this.nodeExpandService.fetchExpand(this.clickedNode.uuid);
      }
      this.setLabel();
    });


    this.dataConnectionService.responses.subscribe(response => {
      if (response.type == 'counts') {
        this.counts[response.data._fields[0][0].toLowerCase()] = response.data._fields[1].low;
        this.counts.total = this.counts.total + response.data._fields[1].low;
      }
    });

    this.nodeMenuController.clickedmenu$.subscribe(res => {
      if (this.clickedNode) {
        if (res && this.openMenu === res) {
          this.nodeMenuController.hideMenus();
          this.openMenu = res;
        } else if (!res && this.openMenu === res) {
          this.openMenu = !res;
        } else {
          this.openMenu = res;
        }
      }
    });

    this.settingsService.dataChange.subscribe(settings => {
      this.settings = settings;
        this.setLabel();
    });
  }

  setLabel(): void {
   if (this.clickedNode) {
     switch (this.clickedNode._type) {
       case 'target': {
         this.label = this.clickedNode[this.settings.targetLabel];
         break;
       }
       case 'compound': {
         if (this.label && this.settings.compoundLabel === 'structure') {
           this.label = this.settings.compoundLabel;
         } else {
           this.label = this.clickedNode['hash'];
         }
         break;
       }
       case 'pattern': {
         this.label = this.settings.patternLabel;
         break;
       }
     }
   }
  }

  expand(label): void {
   this.loadingService.toggleVisible(true);
   const params = {
     'origin': this.clickedNode.labels[0],
     'target': label
   };
   if (label == 'Predictions') {
     this.graphDataService.nodeExpand(this.clickedNode.uuid, 'prediction', params);
   } else {
     this.graphDataService.nodeExpand(this.clickedNode.uuid, 'expand', params);
   }
    this.expanded[label.toLowerCase()] = true;
    this.nodeExpandService.setExpand(this.clickedNode.uuid, this.expanded);
    this.closeMenu();
  }

  collapse(label): void {
    this.graphDataService.nodeCollapse(this.clickedNode);
    this.expanded[label.toLowerCase()] = false;
    this.nodeExpandService.setExpand(this.clickedNode.uuid, this.expanded);
    this.closeMenu();
  }

  closeMenu(): void {
    this.nodeMenuController.hideMenus();
    this.openMenu = false;
  }
}
