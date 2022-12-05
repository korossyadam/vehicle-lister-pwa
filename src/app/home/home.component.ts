import { Component } from '@angular/core';
import { Observable, Observer, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  public isOnline: boolean;

  ngOnInit(): void {
    this.createOnline$().subscribe(isOnline => this.isOnline = isOnline);
 }

  createOnline$() {
    return merge(
       fromEvent(window, 'offline').pipe(map(() => false)),
       fromEvent(window, 'online').pipe(map(() => true)),
       new Observable((sub: Observer<boolean>) => {
          sub.next(navigator.onLine);
          sub.complete();
       }));
 }

}
