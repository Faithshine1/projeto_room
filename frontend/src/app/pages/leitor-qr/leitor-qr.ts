
import { CommonModule } from '@angular/common';

import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import { BrowserQRCodeReader } from '@zxing/browser';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

interface EntradaConfirmada {
  sala: string;
  horario: string;
}

interface RespostaConfirmacao {
  sucesso: boolean;
  mensagem?: string;
  entrada?: EntradaConfirmada;
}

@Component({
  selector: 'app-leitor-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leitor-qr.html',
  styleUrl: './leitor-qr.css'
})
export class LeitorQrComponent implements OnDestroy {

  @ViewChild('video', { static: true })
  video!: ElementRef<HTMLVideoElement>;

  private readonly http = inject(HttpClient);
  private readonly leitor = new BrowserQRCodeReader();

  private controles?: { stop: () => void };
  private requisicaoEntrada?: Subscription;

  private processando = false;
  private destruido = false;
  private sessaoLeitura = 0;

  // ESTADOS DA INTERFACE
  mensagem = signal(
    'Clique em iniciar leitor para escanear o QR Code da sala.'
  );

  lendo = signal(false);
  iniciando = signal(false);
  validando = signal(false);
  sucesso = signal(false);
  erro = signal(false);

  entradaConfirmada = signal<EntradaConfirmada | null>(null);

  private readonly apiUrl =
    `${environment.apiUrl.replace(/\/+$/, '')}/salas`;

  // =====================================
  // INICIAR LEITOR
  // =====================================

  async iniciarLeitura(): Promise<void> {

    if (
      this.destruido ||
      this.lendo() ||
      this.iniciando() ||
      this.validando()
    ) {
      return;
    }

    const sessaoAtual = ++this.sessaoLeitura;

    this.processando = false;

    this.sucesso.set(false);
    this.erro.set(false);
    this.entradaConfirmada.set(null);

    this.lendo.set(true);
    this.iniciando.set(true);

    this.mensagem.set(
      'Solicitando acesso à câmera...'
    );

    try {

      const controlesCamera =
        await this.leitor.decodeFromVideoDevice(
          undefined,
          this.video.nativeElement,
          (resultado, _erro, controles) => {

            // Ignora leituras antigas ou duplicadas.
            if (
              this.destruido ||
              sessaoAtual !== this.sessaoLeitura ||
              !this.lendo() ||
              this.processando ||
              !resultado
            ) {
              return;
            }

            this.processando = true;

            // Interrompe a câmera assim que o QR é lido.
            controles.stop();
            this.controles = undefined;

            this.lendo.set(false);
            this.iniciando.set(false);
            this.validando.set(true);

            this.confirmarEntrada(
              resultado.getText(),
              sessaoAtual
            );
          }
        );

      // Se a leitura foi cancelada enquanto a
      // câmera estava iniciando, libera o dispositivo.
      if (
        this.destruido ||
        sessaoAtual !== this.sessaoLeitura ||
        !this.lendo()
      ) {
        controlesCamera.stop();
        return;
      }

      this.controles = controlesCamera;
      this.iniciando.set(false);

      this.mensagem.set(
        'Câmera ativa. Posicione o QR Code da sala dentro da área indicada.'
      );

    } catch (erro) {

      if (
        this.destruido ||
        sessaoAtual !== this.sessaoLeitura
      ) {
        return;
      }

      console.error(
        'Erro ao iniciar leitor QR Code:',
        erro
      );

      this.pararCameraInterna();

      this.lendo.set(false);
      this.iniciando.set(false);
      this.erro.set(true);

      this.mensagem.set(
        this.obterMensagemErroCamera(erro)
      );
    }
  }

  // =====================================
  // CONFIRMAR ENTRADA NO BACKEND
  // =====================================

  private confirmarEntrada(
    qrCode: string,
    sessaoAtual: number
  ): void {

    this.mensagem.set(
      'QR Code identificado. Validando sua entrada...'
    );

    this.requisicaoEntrada = this.http
      .post<RespostaConfirmacao>(
        `${this.apiUrl}/confirmar-entrada`,
        { qrCode }
      )
      .subscribe({

        next: (resposta) => {

          if (
            this.destruido ||
            sessaoAtual !== this.sessaoLeitura
          ) {
            return;
          }

          this.validando.set(false);
          this.processando = false;

          const confirmado = resposta.sucesso === true;

          this.sucesso.set(confirmado);
          this.erro.set(!confirmado);

          this.mensagem.set(
            resposta.mensagem ||
            (
              confirmado
                ? 'Entrada confirmada com sucesso!'
                : 'Não foi possível confirmar a entrada.'
            )
          );

          this.entradaConfirmada.set(
            confirmado && resposta.entrada
              ? resposta.entrada
              : null
          );
        },

        error: (erro: HttpErrorResponse) => {

          if (
            this.destruido ||
            sessaoAtual !== this.sessaoLeitura
          ) {
            return;
          }

          console.error(
            'Erro ao confirmar entrada:',
            erro
          );

          this.validando.set(false);
          this.processando = false;

          this.sucesso.set(false);
          this.erro.set(true);
          this.entradaConfirmada.set(null);

          this.mensagem.set(
            this.obterMensagemErroBackend(erro)
          );
        }
      });
  }

  // =====================================
  // PARAR CÂMERA
  // =====================================

  private pararCameraInterna(): void {

    this.controles?.stop();
    this.controles = undefined;
  }

  pararLeitura(): void {

    // Invalida callbacks de leituras anteriores.
    ++this.sessaoLeitura;

    this.pararCameraInterna();

    this.lendo.set(false);
    this.iniciando.set(false);

    this.processando = false;

    this.mensagem.set(
      'Leitura interrompida. Você pode iniciar novamente.'
    );
  }

  // =====================================
  // TRATAMENTO DE ERROS
  // =====================================

  private obterMensagemErroCamera(
    erro: unknown
  ): string {

    if (erro instanceof Error) {

      switch (erro.name) {

        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return (
            'Acesso à câmera negado. ' +
            'Autorize a câmera nas permissões do navegador.'
          );

        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return (
            'Nenhuma câmera foi encontrada neste dispositivo.'
          );

        case 'NotReadableError':
        case 'TrackStartError':
          return (
            'A câmera está indisponível. ' +
            'Verifique se outro aplicativo está utilizando-a.'
          );

        case 'SecurityError':
          return (
            'O navegador bloqueou o acesso à câmera. ' +
            'Use uma conexão segura (HTTPS ou localhost).'
          );
      }
    }

    return (
      'Não foi possível iniciar a câmera. ' +
      'Verifique as permissões e tente novamente.'
    );
  }

  private obterMensagemErroBackend(
    erro: HttpErrorResponse
  ): string {

    const resposta = erro.error as
      | { message?: string | string[]; mensagem?: string }
      | null;

    if (
      resposta &&
      typeof resposta === 'object'
    ) {

      if (
        typeof resposta.mensagem === 'string' &&
        resposta.mensagem.trim()
      ) {
        return resposta.mensagem;
      }

      if (typeof resposta.message === 'string') {
        return resposta.message;
      }

      if (Array.isArray(resposta.message)) {
        return resposta.message.join('. ');
      }
    }

    if (erro.status === 0) {
      return (
        'Não foi possível conectar ao servidor. ' +
        'Verifique se o backend está funcionando.'
      );
    }

    return (
      'Não foi possível confirmar sua entrada. ' +
      'Verifique o QR Code e tente novamente.'
    );
  }

  // =====================================
  // ENCERRAR COMPONENTE
  // =====================================

  ngOnDestroy(): void {

    this.destruido = true;
    ++this.sessaoLeitura;

    this.pararCameraInterna();

    this.requisicaoEntrada?.unsubscribe();
  }
}
