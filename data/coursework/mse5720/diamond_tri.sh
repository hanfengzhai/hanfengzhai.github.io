#!/bin/bash
#SBATCH -J diamond        # Job Name
#SBATCH -o diamond.o%j    # Name of the error and output files (%j appends the jobID)
#SBATCH -N 1             # Requests nodes
#SBATCH -n 15            # Requests number of tasks, in multiples of 64
#SBATCH -p development   # Queue name: development (max 2 hr walltime) or normal
#SBATCH -t 00:30:00      # Run time (hh:mm:ss)
#SBATCH -A TG-MPS150006

module load intel/19.1.1
module load impi/19.0.7
module load mvapich2/2.3.6
module load qe/7.0

eta_list="0.0015 0.0010 0.0005 0.0000"
eta_tetra_list="0.5015 0.5010 0.5005 0.5000"
set $eta_tetra_list
for eta in $eta_list
do
cat > Diamond_tri_1.$eta.in << EOF
&CONTROL
 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Diamond',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=6.674d0,
 nat=2,
 ntyp=1,
 ecutwfc=40,
 occupations = 'fixed',
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
C 12.011d0 C_LDA.UPF

ATOMIC_POSITIONS
C 0.d0 0.d0 0.d0
C 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  6 6 6 0 0 0

CELL_PARAMETERS alat 
-0.5 $eta $1
-$eta 0.5 $1
-0.5 0.5 0.d0
EOF

pw.x < Diamond_tri_1.$eta.in > Diamond_tri_1.$eta.out # Run the executable named pw.x 

done

eta_list="0.0005 0.0010 0.0015"
eta_tetra_list="0.4995 0.4990 0.4985"
set $eta_tetra_list
for eta in $eta_list
do
cat > Diamond_tri_2.$eta.in << EOF
&CONTROL
 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Diamond',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=6.68d0,
 nat=2,
 ntyp=1,
 ecutwfc=40,
 occupations = 'fixed',
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
C 12.011d0 C_LDA.UPF

ATOMIC_POSITIONS
C 0.d0 0.d0 0.d0
C 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  6 6 6 0 0 0

CELL_PARAMETERS alat 
-0.5 $1 0.5
$2 0.5 0.5
-$eta $eta 0.d0
EOF

pw.x < Diamond_tri_2.$eta.in > Diamond_tri_2.$eta.out # Run the executable named pw.x 

done

# rm *.igk *.wfc*
# rm -r *.save


