import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SEGREDO_SUPER_SEGURO_AQUI',
    });
  }

  async validate(payload: any) {
    return { 
      idUsuario: payload.sub, 
      email: payload.email, 
      nivelAcesso: payload.nivelAcesso 
    };
  }
}
