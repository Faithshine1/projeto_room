import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
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

  mensagem = signal('Toque em iniciar para ler o QR Code.');
  sucesso = signal(false);
  lendo = signal(false);

  private readonly apiUrl = `${environment.apiUrl}/salas`;

  async iniciarLeitura() {
    if (this.lendo() || this.processando) return;

    this.lendo.set(true);
    this.mensagem.set('Solicitando acesso à câmera...');
    this.sucesso.set(false);

    try {
      const controlesCamera = await this.leitor.decodeFromVideoDevice(
        undefined,
        this.video.nativeElement,
        (resultado, _erro, controles) => {
          if (resultado && !this.processando) {
            this.processando = true;
            controles.stop();
            this.controles = undefined;
            this.lendo.set(false);
            this.confirmarEntrada(resultado.getText());
          }
        },
      );

      this.controles = controlesCamera;
      this.mensagem.set('Aponte a câmera para o QR Code da sala.');
    } catch (erro) {
      console.error('Erro ao iniciar leitor:', erro);
      this.lendo.set(false);
      this.mensagem.set(
        'Não foi possível abrir a câmera. Verifique as permissões e tente novamente.',
      );
    }
  }

  private confirmarEntrada(qrCode: string) {
    this.mensagem.set('Validando QR Code...');

    this.http
      .post<{
        sucesso: boolean;
        mensagem: string;
        entrada: { sala: string; horario: string };
      }>(`${this.apiUrl}/confirmar-entrada`, { qrCode })
      .subscribe({
        next: (resposta) => {
          this.sucesso.set(resposta.sucesso);
          this.mensagem.set(resposta.mensagem);
          this.processando = false;
        },
        error: (erro) => {
          console.error('Erro ao confirmar entrada:', erro);
          this.sucesso.set(false);
          this.mensagem.set(
            erro.error?.message ?? 'Não foi possível confirmar a entrada.',
          );
          this.processando = false;
        },
      });
  }

  pararLeitura() {
    this.controles?.stop();
    this.controles = undefined;
    this.lendo.set(false);
  }

  ngOnDestroy() {
    this.pararLeitura();
  }
}