import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    return this.http.get<any[]>(this.url).pipe(
      map(data => {
        return data.find(
          (u: any) =>
            u.username === username &&
            u.password === password
        ) || null;
      })
    );
  }

  createToken(username: string) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: username, iat: Date.now() }));
    const signature = btoa('fake-signature');
    return `fake-jwt.${header}.${payload}.${signature}`;
  }
}
