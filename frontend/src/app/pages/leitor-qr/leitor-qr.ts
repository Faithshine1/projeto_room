import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BrowserQRCodeReader } from '@zxing/browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-leitor-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leitor-qr.html',
  styleUrl: './leitor-qr.css',
})
export class LeitorQrComponent implements OnDestroy {
  @ViewChild('video')
  video!: ElementRef<HTMLVideoElement>;

  private http = inject(HttpClient);
  private leitor = new BrowserQRCodeReader();

  private controles?: { stop: () => void };
  private processando = false;

  mensagem = 'Toque em iniciar para ler o QR Code.';
  sucesso = false;
  lendo = false;

  // Em produção, configure o endereço real do seu backend.
  private readonly apiUrl = `${environment.apiUrl}/salas`;

  async iniciarLeitura() {
    if (this.lendo || this.processando) return;

    this.lendo = true;
    this.mensagem = 'Solicitando acesso à câmera...';
    this.sucesso = false;

    try {
      this.controles = await this.leitor.decodeFromVideoDevice(
        undefined,
        this.video.nativeElement,
        (resultado, erro, controles) => {
          if (resultado && !this.processando) {
            this.processando = true;
            this.pararLeitura();
            this.confirmarEntrada(resultado.getText());
          }
        },
      );

      this.mensagem = 'Aponte a câmera para o QR Code da sala.';
    } catch (erro) {
      this.lendo = false;
      this.mensagem =
        'Não foi possível abrir a câmera. Verifique as permissões e a conexão HTTPS.';
    }
  }

  private confirmarEntrada(qrCode: string) {
    this.mensagem = 'Validando QR Code...';

    this.http
      .post<{
        sucesso: boolean;
        mensagem: string;
        entrada: { sala: string; horario: string };
      }>(`${this.apiUrl}/confirmar-entrada`, { qrCode })
      .subscribe({
        next: (resposta) => {
          this.sucesso = resposta.sucesso;
          this.mensagem = resposta.mensagem;
          this.processando = false;
        },
        error: (erro) => {
          this.sucesso = false;
          this.mensagem =
            erro.error?.message ??
            'Não foi possível confirmar a entrada.';
          this.processando = false;
        },
      });
  }

  pararLeitura() {
    this.controles?.stop();
    this.controles = undefined;
    this.lendo = false;
  }

  ngOnDestroy() {
    this.pararLeitura();
  }
}