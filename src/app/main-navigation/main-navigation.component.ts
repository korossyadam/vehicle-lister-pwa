import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-main-navigation',
  templateUrl: './main-navigation.component.html',
  styleUrls: ['./main-navigation.component.css']
})
export class MainNavigationComponent {

  @Output() carSelectClickedEvent = new EventEmitter<boolean>();

  constructor() {}

  /**
    * Calls the sidenav's open() method
    */
   onCarSelectorButtonClick(): void {
    this.carSelectClickedEvent.emit(true);
 }

}
