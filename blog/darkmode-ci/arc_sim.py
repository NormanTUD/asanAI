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

def slerp(A, B, ang):
    A=norm(A); B=norm(B)
    pts=[]
    n=32
    for i in range(n+1):
        t=i/n
        s1=math.sin((1-t)*ang)/math.sin(ang or 1e-6)
        s2=math.sin(t*ang)/math.sin(ang or 1e-6)
        p=add(scale(A,s1), scale(B,s2))
        pts.append(norm(p))
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
def thread_occ(ents, C, lift, base=0.01, kind='influence'):
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
            L = 0.9 if k=='signal' else 0.5
            for i in range(33):
                tt=i/32
                dirv=slerp(a3,b3,ang)[i]
                r=EARTH_R+base+L*ang*math.sin(math.pi*tt)
                P=scale(dirv,r)
                tot+=1
                if occluded(P,C): occ+=1
    return occ/tot if tot else 0

def main():
    ents, thrs = load()
    C = camera_pos()
    print('camera at', tuple(round(x,2) for x in C))
    print('threads:', len(thrs))
    base=0.01
    for label,(li,ls) in {'current (0.5/0.9)':(0.5,0.9)}.items():
        pass
    # current behavior, per kind, default camera
    for k in ['influence','journey','signal']:
        print(f'  occ {k:9s} current lift = {thread_occ(ents,C,0.5,0.01,k):.3f}')
    # sweep lift multipliers (applied uniformly on top of kind factor)
    print('\nsweep lift multiplier (influence/journey base 0.5, signal 0.9):')
    for m in [1.0,1.5,2.0,2.5,3.0,4.0]:
        o=[thread_occ(ents,C,0.5*m,0.01,'influence'),
           thread_occ(ents,C,0.5*m,0.01,'journey'),
           thread_occ(ents,C,0.9*m,0.01,'signal')]
        print(f'  x{m:4.1f}  infl={o[0]:.3f} jrn={o[1]:.3f} sig={o[2]:.3f}')
    # also try raising base offset
    print('\nsweep base offset (lift fixed current):')
    for base in [0.01,0.03,0.06,0.10,0.15]:
        o=[thread_occ(ents,C,0.5,base,'influence'),
           thread_occ(ents,C,0.5,base,'journey'),
           thread_occ(ents,C,0.9,base,'signal')]
        print(f'  base={base:5.2f}  infl={o[0]:.3f} jrn={o[1]:.3f} sig={o[2]:.3f}')

if __name__=='__main__':
    main()
