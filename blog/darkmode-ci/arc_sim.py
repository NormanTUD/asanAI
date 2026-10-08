#!/usr/bin/env python3
"""Numerically confirm the thread-occlusion bug in the Atlas globe and tune the
great-circle lift so arcs clear the globe's silhouette instead of vanishing at
the limb."""
import json, math

EARTH_R = 1.0
DEG = math.pi / 180

def latLngToVec3(lat, lng, r):
    phi = (lng + 180) * DEG
    th = (90 - lat) * DEG
    st = math.sin(th)
    return (-r*st*math.cos(phi), r*math.cos(th), r*st*math.sin(phi))

def vec(a):
    return tuple(a)
def sub(a,b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def dot(a,b): return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
def norm(a):
    l=math.sqrt(dot(a,a)); return (a[0]/l,a[1]/l,a[2]/l)
def scale(a,s): return (a[0]*s,a[1]*s,a[2]*s)
def add(a,b): return (a[0]+b[0],a[1]+b[1],a[2]+b[2])

def camera_pos(theta=-0.4, phi=1.15, d=3.2):
    sp = math.sin(phi)
    return (d*sp*math.cos(theta), d*math.cos(phi), d*sp*math.sin(theta))

def _perp(a):
    a=norm(a)
    ax=(0,0,1) if abs(a[2])<0.9 else (1,0,0)
    cr=(a[1]*ax[2]-a[2]*ax[1], a[2]*ax[0]-a[0]*ax[2], a[0]*ax[1]-a[1]*ax[0])
    return norm(cr)
def _rotate_about_axis(a, axis, ang):
    a=norm(a); axis=norm(axis)
    x,y,z=axis
    K=[[0,-z,y],[z,0,-x],[-y,x,0]]
    c,s=math.cos(ang),math.sin(ang)
    I=[[1,0,0],[0,1,0],[0,0,1]]
    def mul(M,v): return tuple(M[i][0]*v[0]+M[i][1]*v[1]+M[i][2]*v[2] for i in range(3))
    K2=[[K[i][0]*K[j][0] for j in range(3)] for i in range(3)]
    R=[[I[i][j]*c + K[i][j]*s + K2[i][j]*(1-c) for j in range(3)] for i in range(3)]
    return norm(mul(R,a))
def slerp(A, B, ang):
    A=norm(A); B=norm(B)
    pts=[]; n=32
    antipodal = math.cos(ang) < -0.9999
    if antipodal:
        axis=_perp(A)
        for i in range(n+1):
            t=i/n
            pts.append(_rotate_about_axis(A, axis, ang*t))
        return pts
    for i in range(n+1):
        t=i/n
        s1=math.sin((1-t)*ang)/math.sin(ang or 1e-6)
        s2=math.sin(t*ang)/math.sin(ang or 1e-6)
        p=add(scale(A,s1), scale(B,s2))
        l=math.sqrt(dot(p,p))
        if l<1e-9: pts.append((1,0,0)); continue
        pts.append((p[0]/l,p[1]/l,p[2]/l))
    return pts

def arc_radius(t, ang, lift, base=0.01):
    return EARTH_R + base + lift*ang*math.sin(math.pi*t)

def occluded(P, C):
    """Is point P (radius>1) hidden behind the r=1 globe as seen from camera C?"""
    D = sub(P, C)
    a = dot(D,D)
    b = 2*dot(C,D)
    c = dot(C,C)-1.0
    disc = b*b-4*a*c
    if disc < 0: return False
    sq = math.sqrt(disc)
    s_enter = (-b - sq)/(2*a)
    return 0 < s_enter < 1

def load():
    ents = {e['id']: e for e in json.load(open('atlas/entities.json')) if e.get('lat') is not None}
    thrs = json.load(open('atlas/threads.json'))
    return ents, thrs

_TH = []
def thread_occ(ents, C, lift, base=0.01, kind='influence', occ_hist=None):
    tot=0; occ=0
    for t in _TH:
        k = t.get('kind','influence')
        if kind and k!=kind: continue
        if k=='journey':
            nodes=[t.get('person')]+list(t.get('path',[]))
            pairs=[]
            for i in range(len(nodes)-1):
                pairs.append((nodes[i],nodes[i+1]))
        else:
            pairs=[(t.get('from'),t.get('to'))]
        for (f,to) in pairs:
            A=ents.get(f); B=ents.get(to)
            if not A or not B: continue
            a3=latLngToVec3(A['lat'],A['lng'],EARTH_R)
            b3=latLngToVec3(B['lat'],B['lng'],EARTH_R)
            ang=math.acos(max(-1,min(1,dot(norm(a3),norm(b3)))))
            L = (0.9 if k=='signal' else 0.5)*lift
            for i in range(33):
                tt=i/32
                dirv=slerp(a3,b3,ang)[i]
                r=EARTH_R+base+L*ang*math.sin(math.pi*tt)
                P=scale(dirv,r)
                tot+=1
                if occluded(P,C):
                    occ+=1
                    if occ_hist is not None: occ_hist.append((tt,r))
    return occ/tot if tot else 0

def main():
    global _TH
    ents, thrs = load()
    _TH = thrs
    C = camera_pos()
    print('camera at', tuple(round(x,2) for x in C))
    print('threads:', len(thrs))
    base=0.01
    for label,(li,ls) in {'current (0.5/0.9)':(0.5,0.9)}.items():
        pass
    # current behavior, per kind, default camera
    for k in ['influence','journey','signal']:
        print(f'  occ {k:9s} current lift = {thread_occ(ents,C,1.0,0.01,k):.3f}')
    # WHERE does occlusion happen along the arc? (t=0 near 'from', t=1 near 'to')
    print('\nwhere do occluded samples sit along the arc (t)? current lift:')
    for k in ['influence','journey','signal']:
        hist=[]
        thread_occ(ents,C,1.0,0.01,k,hist)
        if hist:
            bins={'endpoints t<.12':0,'t .12-.35':0,'middle .35-.65':0,'t .65-.88':0,'endpoints t>.88':0}
            for (tt,r) in hist:
                if tt<0.12: bins['endpoints t<.12']+=1
                elif tt<0.35: bins['t .12-.35']+=1
                elif tt<0.65: bins['middle .35-.65']+=1
                elif tt<0.88: bins['t .65-.88']+=1
                else: bins['endpoints t>.88']+=1
            rmed=sorted(r for _,r in hist)[len(hist)//2]
            print(f'  {k:9s} total={len(hist):4d} medianR={rmed:.3f}  '+
                  ' '.join(f'{v}' for v in bins.values()))
            print(f'            bins: endpoints<.12 / .12-.35 / mid / .65-.88 / >.88')

    # sweep lift multipliers (applied uniformly on top of kind factor)
    print('\nsweep lift multiplier (x on influence/journey 0.5, signal 0.9):')
    for m in [1.0,1.5,2.0,3.0,4.0,6.0]:
        o=[thread_occ(ents,C,m,0.01,'influence'),
           thread_occ(ents,C,m,0.01,'journey'),
           thread_occ(ents,C,m,0.01,'signal')]
        print(f'  x{m:4.1f}  infl={o[0]:.3f} jrn={o[1]:.3f} sig={o[2]:.3f}')
    # raise base offset (clears limb regardless of arc length)
    print('\nsweep base offset (lift fixed current):')
    for base in [0.01,0.05,0.10,0.18,0.30]:
        o=[thread_occ(ents,C,1.0,base,'influence'),
           thread_occ(ents,C,1.0,base,'journey'),
           thread_occ(ents,C,1.0,base,'signal')]
        print(f'  base={base:5.2f}  infl={o[0]:.3f} jrn={o[1]:.3f} sig={o[2]:.3f}')

if __name__=='__main__':
    main()
