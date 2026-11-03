# Utilidades comunes para generar las unidades (src/data/uNN.json).
import json, os
from collections import Counter
class Unidad:
    def __init__(s, n): s.n=n; s.items=[]; s.c=Counter()
    def _id(s,k): s.c[k]+=1; return f"u{s.n:02d}-{k}{s.c[k]:02d}"
    def _b(s,k,tipo,tema,p,fuente,d,et,**kw):
        it=dict(id=s._id(k),unidad=s.n,tema=tema,tipo=tipo,pregunta=p,fuente=fuente,dificultad=d,etiquetas=list(et)); it.update(kw); s.items.append(it)
    def F(s,tema,p,r,e,fuente,d=1,et=()): s._b("f","flashcard",tema,p,fuente,d,et,respuesta=r,explicacion=e)
    def M(s,tema,p,ok,malas,e,fuente,d=2,et=()): s._b("m","mcq",tema,p,fuente,d,et,opciones=[ok]+malas,correcta=ok,respuesta=ok,explicacion=e)
    def V(s,tema,p,v,jok,jm,e,fuente,d=2,et=()):
        c="Verdadero" if v else "Falso"; s._b("v","vf",tema,p,fuente,d,et,opciones=["Verdadero","Falso"],correcta=c,justificaciones=[jok]+jm,justificacionCorrecta=jok,respuesta=f"{c}. {jok}",explicacion=e)
    def C(s,tema,relato,p,r,pk,e,fuente,d=2,et=()): s._b("c","caso",tema,p,fuente,d,et,relato=relato,respuesta=r,puntosClave=pk,explicacion=e)
    def D(s,tema,p,r,pk,e,fuente,d=3,et=()): s._b("d","desarrollo",tema,p,fuente,d,et,respuesta=r,puntosClave=pk,explicacion=e)
    def R(s,tema,p,pares,e,fuente,d=2,et=()): s._b("r","matching",tema,p,fuente,d,et,pares=[{"a":a,"b":b} for a,b in pares],respuesta="; ".join(f"{a} → {b}" for a,b in pares),explicacion=e)
    def T(s,tema,p,ev,e,fuente,d=2,et=()): s._b("t","timeline",tema,p,fuente,d,et,eventos=[{"fecha":f,"texto":t} for f,t in ev],respuesta=" → ".join(f"{f}: {t}" for f,t in ev),explicacion=e)
    def guardar(s,titulo,nota,temas,cuadros,esquemas,linea):
        u=dict(unidad=s.n,titulo=titulo,estado="cargado",nota=nota,temas=temas,cuadros=cuadros,esquemas=esquemas,lineaDeTiempo=linea,items=s.items)
        out=os.path.join(os.path.dirname(__file__),"..","..","src","data",f"u{s.n:02d}.json")
        json.dump(u,open(out,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
        print(f"u{s.n:02d}:",Counter(i["tipo"] for i in s.items))
