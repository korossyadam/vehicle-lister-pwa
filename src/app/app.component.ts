import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'vehicle-lister';

  update: boolean = false;

  constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
      this.update = true;
    })
  }
}
