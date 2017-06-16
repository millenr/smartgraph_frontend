/**
 * Created by sheilstk on 6/16/17.
 */
import { NgModule } from '@angular/core';
import {MdButtonModule, MdCheckboxModule, MdMenuModule, MdToolbarModule} from '@angular/material';

@NgModule({
  imports: [MdButtonModule, MdCheckboxModule, MdMenuModule, MdToolbarModule],
  exports: [MdButtonModule, MdCheckboxModule, MdMenuModule, MdToolbarModule],
})
export class MaterialModule { }
